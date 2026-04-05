import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_STATS } from "@/lib/constants/app";
import { useStatsStore } from "@/lib/stores/stats-store";

describe("stats store", () => {
  beforeEach(() => {
    localStorage.clear();
    useStatsStore.getState().resetStats();
  });

  it("accumulates pomodoros and rubs without allowing negative additions", () => {
    useStatsStore.getState().addPomodoro();
    useStatsStore.getState().addPomodoro();
    useStatsStore.getState().addRubs(4);
    useStatsStore.getState().addRubs(-2);

    const state = useStatsStore.getState();

    expect(state.pomodoros).toBe(2);
    expect(state.rubs).toBe(4);
  });

  it("resets the counters back to defaults", () => {
    useStatsStore.getState().addPomodoro();
    useStatsStore.getState().addRubs(7);

    useStatsStore.getState().resetStats();

    expect(useStatsStore.getState()).toMatchObject(DEFAULT_STATS);
  });
});
