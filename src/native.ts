import { invoke } from "@tauri-apps/api/core";

export interface TodayStats {
  activeSeconds: number;
  idleSeconds: number;
  appSwitches: number;
  currentApp?: string;
  topApps: { appName: string; seconds: number }[];
}

const emptyStats: TodayStats = {
  activeSeconds: 0,
  idleSeconds: 0,
  appSwitches: 0,
  topApps: [],
};

function isDesktop() {
  return "__TAURI_INTERNALS__" in window;
}

export async function getTodayStats() {
  if (!isDesktop()) return emptyStats;
  return invoke<TodayStats>("get_today_stats");
}

export async function setNativeTracking(enabled: boolean, includeTitles: boolean) {
  if (isDesktop()) await invoke("set_tracking", { enabled, includeTitles });
}

export async function deleteNativeActivity() {
  if (isDesktop()) await invoke("delete_activity_data");
}

export async function getDataLocation() {
  if (!isDesktop()) return "浏览器预览模式不会创建活动数据库";
  return invoke<string>("data_location");
}
