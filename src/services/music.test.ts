import { describe, expect, it } from "vitest";
import {
  musicEndAction,
  musicScene,
  nextMusicOffset,
  parseAudiusTracks,
} from "./music";

describe("music recommendation", () => {
  it("支持随机、自动连播与单曲循环", () => {
    expect(nextMusicOffset("shuffle", () => 0.5)).toBe(20);
    expect(nextMusicOffset("sequence")).toBe(1);
    expect(musicEndAction("single", false)).toBe("repeat");
    expect(musicEndAction("shuffle", true)).toBe("next");
    expect(musicEndAction("sequence", false)).toBe("stop");
  });

  it("工作时有任务会选择轻柔器乐场景", () => {
    expect(musicScene(11, true).scene).toBe("轻柔专注");
  });

  it("解析 Audius 官方可播放曲目", () => {
    const tracks = parseAudiusTracks(
      {
        data: [
          {
            id: "abc",
            title: "Quiet Day",
            permalink: "/artist/quiet-day",
            is_streamable: true,
            stream: { url: "https://audio.example/quiet.mp3" },
            user: { name: "Demo Artist" },
          },
        ],
      },
      musicScene(11, true),
    );
    expect(tracks[0]).toMatchObject({
      id: "audius-abc",
      title: "Quiet Day",
      artist: "Demo Artist",
      source: "Audius",
    });
  });
});
