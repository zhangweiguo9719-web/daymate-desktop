import { describe, expect, it } from "vitest";
import { getDailyContent, musicSearchUrl } from "./dailyContent";

describe("dailyContent", () => {
  it("同一天和相同偏移返回稳定内容", () => {
    expect(getDailyContent(0)).toEqual(getDailyContent(0));
  });

  it("音乐搜索链接会编码歌曲与歌手", () => {
    const url = musicSearchUrl("netease", "夜空中最亮的星", "逃跑计划");
    expect(url).toContain("music.163.com");
    expect(url).toContain("%E5%A4%9C");
  });
});
