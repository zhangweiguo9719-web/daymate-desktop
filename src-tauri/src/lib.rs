use chrono::{DateTime, Local, Utc};
use rusqlite::{params, Connection};
use serde::Serialize;
use std::{
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::{Duration, Instant},
};
use tauri::{tray::TrayIconBuilder, Manager, State};

struct AppState {
    database_path: PathBuf,
    tracking_enabled: Arc<AtomicBool>,
    title_capture_enabled: Arc<AtomicBool>,
    reset_requested: Arc<AtomicBool>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TodayStats {
    active_seconds: i64,
    idle_seconds: i64,
    app_switches: i64,
    current_app: Option<String>,
    top_apps: Vec<AppUsage>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppUsage {
    app_name: String,
    seconds: i64,
}

fn initialize_database(path: &Path) -> Result<(), String> {
    let connection = Connection::open(path).map_err(|error| error.to_string())?;
    connection
        .execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA foreign_keys = ON;
             CREATE TABLE IF NOT EXISTS migration_history (
               version INTEGER PRIMARY KEY,
               applied_at TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS app_usage_sessions (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               app_name TEXT NOT NULL,
               window_title TEXT,
               started_at TEXT NOT NULL,
               ended_at TEXT NOT NULL,
               active_seconds INTEGER NOT NULL DEFAULT 0,
               idle_seconds INTEGER NOT NULL DEFAULT 0,
               created_at TEXT NOT NULL
             );
             CREATE INDEX IF NOT EXISTS idx_usage_started_at ON app_usage_sessions(started_at);
             CREATE INDEX IF NOT EXISTS idx_usage_app_name ON app_usage_sessions(app_name);
             INSERT OR IGNORE INTO migration_history(version, applied_at) VALUES (1, datetime('now'));",
        )
        .map_err(|error| error.to_string())
}

fn save_session(
    path: &Path,
    app_name: &str,
    window_title: Option<&str>,
    started_at: DateTime<Utc>,
    ended_at: DateTime<Utc>,
    active_seconds: i64,
    idle_seconds: i64,
) {
    if active_seconds == 0 && idle_seconds == 0 {
        return;
    }
    if let Ok(connection) = Connection::open(path) {
        let _ = connection.execute(
            "INSERT INTO app_usage_sessions
             (app_name, window_title, started_at, ended_at, active_seconds, idle_seconds, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?4)",
            params![
                app_name,
                window_title,
                started_at.to_rfc3339(),
                ended_at.to_rfc3339(),
                active_seconds,
                idle_seconds,
            ],
        );
    }
}

#[cfg(windows)]
fn foreground_application(include_title: bool) -> Option<(String, Option<String>)> {
    use windows_sys::Win32::{
        Foundation::CloseHandle,
        System::Threading::{
            OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION,
        },
        UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId},
    };

    unsafe {
        let window = GetForegroundWindow();
        if window.is_null() {
            return None;
        }
        let mut process_id = 0;
        GetWindowThreadProcessId(window, &mut process_id);
        let process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, process_id);
        if process.is_null() {
            return None;
        }
        let mut path = vec![0u16; 1024];
        let mut size = path.len() as u32;
        let ok = QueryFullProcessImageNameW(process, 0, path.as_mut_ptr(), &mut size);
        CloseHandle(process);
        if ok == 0 {
            return None;
        }
        let full_path = String::from_utf16_lossy(&path[..size as usize]);
        let app_name = Path::new(&full_path)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("unknown")
            .to_string();
        let title = include_title.then(|| {
            let mut buffer = vec![0u16; 512];
            let length = GetWindowTextW(window, buffer.as_mut_ptr(), buffer.len() as i32);
            String::from_utf16_lossy(&buffer[..length.max(0) as usize])
        });
        Some((app_name, title.filter(|value| !value.is_empty())))
    }
}

#[cfg(not(windows))]
fn foreground_application(_include_title: bool) -> Option<(String, Option<String>)> {
    None
}

#[cfg(windows)]
fn idle_seconds() -> u64 {
    use windows_sys::Win32::{
        System::SystemInformation::GetTickCount64,
        UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO},
    };
    unsafe {
        let mut info = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if GetLastInputInfo(&mut info) == 0 {
            return 0;
        }
        GetTickCount64().saturating_sub(info.dwTime as u64) / 1000
    }
}

#[cfg(not(windows))]
fn idle_seconds() -> u64 {
    0
}

fn start_activity_tracker(state: &AppState) {
    let database_path = state.database_path.clone();
    let tracking_enabled = state.tracking_enabled.clone();
    let title_capture_enabled = state.title_capture_enabled.clone();
    let reset_requested = state.reset_requested.clone();
    thread::spawn(move || {
        let mut current_app = String::new();
        let mut current_title: Option<String> = None;
        let mut started_at = Utc::now();
        let mut last_flush = Instant::now();
        let mut active_seconds = 0i64;
        let mut inactive_seconds = 0i64;
        let mut current_day = Local::now().date_naive();

        loop {
            thread::sleep(Duration::from_secs(3));
            if reset_requested.swap(false, Ordering::Relaxed) {
                current_app.clear();
                current_title = None;
                active_seconds = 0;
                inactive_seconds = 0;
                started_at = Utc::now();
                last_flush = Instant::now();
                current_day = Local::now().date_naive();
            }
            if !tracking_enabled.load(Ordering::Relaxed) {
                continue;
            }
            let capture_title = title_capture_enabled.load(Ordering::Relaxed);
            let Some((app_name, title)) = foreground_application(capture_title) else {
                continue;
            };
            let is_idle = idle_seconds() >= 300;
            let day_changed = Local::now().date_naive() != current_day;
            let app_changed = app_name != current_app || (capture_title && title != current_title);
            if (!current_app.is_empty() && app_changed)
                || day_changed
                || last_flush.elapsed().as_secs() >= 60
            {
                save_session(
                    &database_path,
                    &current_app,
                    current_title.as_deref(),
                    started_at,
                    Utc::now(),
                    active_seconds,
                    inactive_seconds,
                );
                current_app = app_name.clone();
                current_title = title.clone();
                started_at = Utc::now();
                active_seconds = 0;
                inactive_seconds = 0;
                last_flush = Instant::now();
                current_day = Local::now().date_naive();
            }
            if current_app.is_empty() {
                current_app = app_name;
                current_title = title;
                started_at = Utc::now();
            }
            if is_idle {
                inactive_seconds += 3;
            } else if !current_app.eq_ignore_ascii_case("daymate-desktop.exe") {
                active_seconds += 3;
            }
        }
    });
}

#[tauri::command]
fn set_tracking(state: State<'_, AppState>, enabled: bool, include_titles: bool) {
    state.tracking_enabled.store(enabled, Ordering::Relaxed);
    state
        .title_capture_enabled
        .store(include_titles, Ordering::Relaxed);
}

#[tauri::command]
fn get_today_stats(state: State<'_, AppState>) -> Result<TodayStats, String> {
    let connection = Connection::open(&state.database_path).map_err(|error| error.to_string())?;
    let start = Local::now()
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .expect("valid start of day")
        .and_local_timezone(Local)
        .single()
        .expect("valid local date")
        .with_timezone(&Utc)
        .to_rfc3339();
    let (active_seconds, idle_seconds, app_switches) = connection
        .query_row(
            "SELECT COALESCE(SUM(active_seconds), 0), COALESCE(SUM(idle_seconds), 0), COUNT(*)
             FROM app_usage_sessions WHERE started_at >= ?1",
            [&start],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|error| error.to_string())?;
    let mut statement = connection
        .prepare(
            "SELECT app_name, SUM(active_seconds) AS seconds FROM app_usage_sessions
             WHERE started_at >= ?1 GROUP BY app_name ORDER BY seconds DESC LIMIT 5",
        )
        .map_err(|error| error.to_string())?;
    let top_apps = statement
        .query_map([&start], |row| {
            Ok(AppUsage {
                app_name: row.get(0)?,
                seconds: row.get(1)?,
            })
        })
        .map_err(|error| error.to_string())?
        .filter_map(Result::ok)
        .collect();
    let current_app = foreground_application(false).map(|value| value.0);
    Ok(TodayStats {
        active_seconds,
        idle_seconds,
        app_switches,
        current_app,
        top_apps,
    })
}

#[tauri::command]
fn delete_activity_data(state: State<'_, AppState>) -> Result<(), String> {
    state.reset_requested.store(true, Ordering::Relaxed);
    Connection::open(&state.database_path)
        .and_then(|connection| connection.execute("DELETE FROM app_usage_sessions", []))
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn data_location(state: State<'_, AppState>) -> String {
    state.database_path.display().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = std::env::var_os("DAYMATE_DATA_DIR")
                .map(PathBuf::from)
                .unwrap_or(app.path().app_data_dir()?);
            std::fs::create_dir_all(&data_dir)?;
            let database_path = data_dir.join("daymate.sqlite3");
            initialize_database(&database_path).map_err(std::io::Error::other)?;
            let state = AppState {
                database_path,
                tracking_enabled: Arc::new(AtomicBool::new(true)),
                title_capture_enabled: Arc::new(AtomicBool::new(false)),
                reset_requested: Arc::new(AtomicBool::new(false)),
            };
            start_activity_tracker(&state);
            app.manage(state);

            let mut tray = TrayIconBuilder::new().tooltip("DayMate 日伴");
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.on_tray_icon_event(|tray, _| {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            })
            .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_tracking,
            get_today_stats,
            delete_activity_data,
            data_location
        ])
        .run(tauri::generate_context!())
        .expect("error while running DayMate");
}
