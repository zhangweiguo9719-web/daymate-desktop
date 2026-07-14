export interface DailyTheme {
  name: string;
  mood: string;
  base: string;
  glowA: string;
  glowB: string;
  accent: string;
}

export const dailyThemes: DailyTheme[] = [
  {
    name: "晨雾青岚",
    mood: "安静、清醒，适合慢慢开始",
    base: "#f2f5ef",
    glowA: "#dce9df",
    glowB: "#f5e5d5",
    accent: "#557a68",
  },
  {
    name: "杏色日光",
    mood: "温暖但不刺眼，像窗边的上午",
    base: "#f7f2e9",
    glowA: "#f1d9c5",
    glowB: "#dfe9dc",
    accent: "#9a6c5b",
  },
  {
    name: "雨后森林",
    mood: "清透、松弛，给思绪留一点空白",
    base: "#edf3ef",
    glowA: "#cfe1d8",
    glowB: "#e7e0cc",
    accent: "#4f7664",
  },
  {
    name: "海盐薄暮",
    mood: "柔和降速，适合下午和傍晚",
    base: "#f0f2f3",
    glowA: "#d6e3e7",
    glowB: "#ead9d2",
    accent: "#5d7880",
  },
  {
    name: "云朵奶茶",
    mood: "轻松、柔软，今天不必绷得太紧",
    base: "#f6f1eb",
    glowA: "#ead8c9",
    glowB: "#dfe7dd",
    accent: "#856b5f",
  },
  {
    name: "薰衣草夜",
    mood: "沉静、舒缓，适合收拢一天",
    base: "#f1eff5",
    glowA: "#ded9ec",
    glowB: "#e9ded5",
    accent: "#6d6885",
  },
  {
    name: "晴空纸页",
    mood: "明亮、干净，适合整理和计划",
    base: "#f3f6f4",
    glowA: "#d9e8ee",
    glowB: "#f0e4c9",
    accent: "#567780",
  },
];

export function getDailyTheme(date = new Date(), offset = 0) {
  const key = Number(
    `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`,
  );
  return dailyThemes[
    (((key + offset) % dailyThemes.length) + dailyThemes.length) %
      dailyThemes.length
  ];
}
