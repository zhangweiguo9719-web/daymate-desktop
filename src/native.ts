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

export async function setNativeTracking(
  enabled: boolean,
  includeTitles: boolean,
) {
  if (isDesktop()) await invoke("set_tracking", { enabled, includeTitles });
}

export async function deleteNativeActivity() {
  if (isDesktop()) await invoke("delete_activity_data");
}

export async function getDataLocation() {
  if (!isDesktop()) return "浏览器预览模式不会创建活动数据库";
  return invoke<string>("data_location");
}

export async function saveAiKey(provider: string, apiKey: string) {
  if (!isDesktop()) throw new Error("请在 DayMate 桌面版中保存密钥");
  await invoke("save_ai_key", { provider, apiKey });
}

export async function hasAiKey(provider: string) {
  if (!isDesktop()) return false;
  return invoke<boolean>("has_ai_key", { provider });
}

export async function deleteAiKey(provider: string) {
  if (isDesktop()) await invoke("delete_ai_key", { provider });
}

export async function testAiConnection(
  provider: string,
  baseUrl: string,
  model: string,
  needsKey: boolean,
) {
  if (!isDesktop()) throw new Error("请在 DayMate 桌面版中测试连接");
  return invoke<string>("test_ai_connection", {
    provider,
    baseUrl,
    model,
    needsKey,
  });
}

export async function recommendMusicWithAi(input: {
  provider: string;
  baseUrl: string;
  model: string;
  preferredCategory: string;
  activeMinutes: number;
  unfinishedTasks: number;
}) {
  if (!isDesktop()) throw new Error("请在 DayMate 桌面版中使用 AI 推荐");
  return invoke<{ category: string; reason: string }>(
    "recommend_music_with_ai",
    input,
  );
}
