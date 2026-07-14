import { describe, expect, it } from "vitest";
import { getDailyContent } from "./dailyContent";

describe("dailyContent", () => {
  it("同一天和相同偏移返回稳定内容", () => {
    expect(getDailyContent(0)).toEqual(getDailyContent(0));
  });
});
