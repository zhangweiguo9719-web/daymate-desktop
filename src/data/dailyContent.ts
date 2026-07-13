import type { DailyContent } from "../types";

const quotes = [
  { text: "慢一点没关系，重要的是今天仍然愿意向前一步。", author: "佚名" },
  { text: "生活不是等待风暴过去，而是学会在雨中跳舞。", author: "佚名" },
  { text: "今天做成一件小事，也是在认真生活。", author: "佚名" },
  { text: "不必一下看清整条路，先走好脚下这一步。", author: "佚名" },
  { text: "休息不是停止前进，而是为下一段路留出力气。", author: "佚名" },
];

const music = [
  { title: "One Summer's Day", artist: "久石让", scene: "安静启动" },
  { title: "River Flows in You", artist: "Yiruma", scene: "轻柔专注" },
  { title: "夜空中最亮的星", artist: "逃跑计划", scene: "找回一点力量" },
  { title: "晴天", artist: "周杰伦", scene: "午后回血" },
  { title: "Experience", artist: "Ludovico Einaudi", scene: "沉浸工作" },
];

const jokes = [
  "今日宜：先打开文件。至于打开以后干什么，交给五分钟后的自己。",
  "电脑风扇已经开始努力了，咱也象征性努力五分钟。",
  "计划写得很满，执行可以从很小开始。毕竟进度条也不是瞬移到 100%。",
  "别等灵感敲门了，它可能也在等你先开工。",
  "今天不和别人比，只和昨天那个多开了十个标签页的自己比。",
];

const challenges = [
  "打开最重要的文件，只处理五分钟。",
  "喝一杯水，然后完成一项十分钟以内的小任务。",
  "关掉一个会分散注意力的网页标签。",
  "整理桌面上三个暂时不用的文件。",
  "写下今天结束时最想获得的感受。",
];

function dayIndex(length: number, offset = 0) {
  const day = Math.floor(new Date().setHours(0, 0, 0, 0) / 86_400_000);
  return (day + offset) % length;
}

export function getDailyContent(offset = 0): DailyContent {
  return {
    quote: quotes[dayIndex(quotes.length, offset)],
    music: music[dayIndex(music.length, offset * 2)],
    joke: jokes[dayIndex(jokes.length, offset * 3)],
    challenge: challenges[dayIndex(challenges.length, offset * 4)],
  };
}

export function musicSearchUrl(platform: string, title: string, artist: string) {
  const query = encodeURIComponent(`${title} ${artist}`);
  const platforms: Record<string, string> = {
    netease: `https://music.163.com/#/search/m/?s=${query}`,
    qq: `https://y.qq.com/n/ryqq/search?w=${query}`,
    spotify: `https://open.spotify.com/search/${query}`,
    apple: `https://music.apple.com/cn/search?term=${query}`,
    youtube: `https://music.youtube.com/search?q=${query}`,
  };
  return platforms[platform] ?? platforms.netease;
}
