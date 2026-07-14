import { describe, expect, it } from "vitest";
import { selectNextTask, useAppStore } from "./store";
import type { Task } from "./types";

function task(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: "任务",
    estimatedMinutes: 25,
    priority: "medium",
    completed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("selectNextTask", () => {
  it("优先选择截止日期更近的未完成任务", () => {
    const result = selectNextTask([
      task({ title: "以后", dueDate: "2026-08-01", priority: "high" }),
      task({ title: "今天", dueDate: "2026-07-13", priority: "low" }),
    ]);
    expect(result?.title).toBe("今天");
  });

  it("忽略已完成任务并在同优先级选择更短任务", () => {
    const result = selectNextTask([
      task({ title: "完成", completed: true, priority: "high" }),
      task({ title: "较长", estimatedMinutes: 45 }),
      task({ title: "较短", estimatedMinutes: 5 }),
    ]);
    expect(result?.title).toBe("较短");
  });
});

describe("floating ball preference", () => {
  it("默认开启并允许用户关闭", () => {
    expect(useAppStore.getState().preferences.floatingBall).toBe(true);
    useAppStore.getState().updatePreferences({ floatingBall: false });
    expect(useAppStore.getState().preferences.floatingBall).toBe(false);
    useAppStore.getState().updatePreferences({ floatingBall: true });
  });
});
