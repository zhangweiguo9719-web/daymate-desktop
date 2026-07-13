export type Page = "today" | "review" | "tasks" | "content" | "privacy" | "settings";

export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  dueDate?: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Preferences {
  nickname: string;
  role: string;
  tone: "gentle" | "fun" | "direct" | "energetic";
  theme: "system" | "light" | "dark";
  trackActivity: boolean;
  trackWindowTitles: boolean;
  idleDetection: boolean;
  notifications: boolean;
  autostart: boolean;
  musicPlatform: "netease" | "qq" | "spotify" | "apple" | "youtube";
}

export interface DailyContent {
  quote: { text: string; author: string };
  music: { title: string; artist: string; scene: string };
  joke: string;
  challenge: string;
}
