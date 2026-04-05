import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTimerStore } from "@/lib/stores/timer-store";

const defaultDurations = {
  studySeconds: 30 * 60,
  breakSeconds: 15 * 60
};

describe("timer store", () => {
  beforeEach(() => {
    localStorage.clear();
    useTimerStore.setState({
      phase: "study",
      isRunning: false,
      remainingSeconds: defaultDurations.studySeconds,
      endAt: null,
      lastTransitionAt: null,
      lastCompletedPhase: null,
      transitionSource: null,
      transitionToken: 0
    });
  });

  it("starts and pauses with a computed remaining time", () => {
    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000);

    useTimerStore.getState().start();

    expect(useTimerStore.getState().isRunning).toBe(true);
    expect(useTimerStore.getState().endAt).toBe(1_801_000);

    nowSpy.mockReturnValue(61_000);
    useTimerStore.getState().pause();

    expect(useTimerStore.getState().isRunning).toBe(false);
    expect(useTimerStore.getState().remainingSeconds).toBe(1740);
  });

  it("transitions automatically when a running phase reaches zero", () => {
    vi.spyOn(Date, "now").mockReturnValue(100_000);

    useTimerStore.setState({
      isRunning: true,
      remainingSeconds: 1,
      endAt: 100_000,
      phase: "study"
    });

    useTimerStore.getState().tick(defaultDurations);

    const state = useTimerStore.getState();

    expect(state.phase).toBe("break");
    expect(state.isRunning).toBe(false);
    expect(state.remainingSeconds).toBe(defaultDurations.breakSeconds);
    expect(state.lastCompletedPhase).toBe("study");
    expect(state.transitionSource).toBe("timer");
    expect(state.transitionToken).toBe(1);
  });

  it("starts the next study session automatically after the reading phase ends", () => {
    vi.spyOn(Date, "now").mockReturnValue(200_000);

    useTimerStore.setState({
      phase: "break",
      isRunning: true,
      remainingSeconds: 1,
      endAt: 200_000
    });

    useTimerStore.getState().tick(defaultDurations);

    const state = useTimerStore.getState();

    expect(state.phase).toBe("study");
    expect(state.isRunning).toBe(true);
    expect(state.remainingSeconds).toBe(defaultDurations.studySeconds);
    expect(state.endAt).toBe(2_000_000);
    expect(state.lastCompletedPhase).toBe("break");
    expect(state.transitionSource).toBe("timer");
  });

  it("hydrates idle durations and skips manually between phases", () => {
    useTimerStore.getState().hydrateDurations({
      studySeconds: 20 * 60,
      breakSeconds: 10 * 60
    });

    expect(useTimerStore.getState().remainingSeconds).toBe(20 * 60);

    useTimerStore.getState().skip(defaultDurations);

    const state = useTimerStore.getState();

    expect(state.phase).toBe("break");
    expect(state.remainingSeconds).toBe(defaultDurations.breakSeconds);
    expect(state.transitionSource).toBe("manual");
    expect(state.lastCompletedPhase).toBe("study");
  });

  it("starts study immediately when the reading phase is skipped manually", () => {
    vi.spyOn(Date, "now").mockReturnValue(300_000);

    useTimerStore.setState({
      phase: "break",
      isRunning: false,
      remainingSeconds: defaultDurations.breakSeconds,
      endAt: null
    });

    useTimerStore.getState().skip(defaultDurations);

    const state = useTimerStore.getState();

    expect(state.phase).toBe("study");
    expect(state.isRunning).toBe(true);
    expect(state.remainingSeconds).toBe(defaultDurations.studySeconds);
    expect(state.endAt).toBe(2_100_000);
    expect(state.transitionSource).toBe("manual");
    expect(state.lastCompletedPhase).toBe("break");
  });

  it("acknowledges handled transitions so they do not replay after remount", () => {
    useTimerStore.getState().skip(defaultDurations);
    const token = useTimerStore.getState().transitionToken;

    useTimerStore.getState().acknowledgeTransition(token);

    const state = useTimerStore.getState();

    expect(state.transitionToken).toBe(token);
    expect(state.lastCompletedPhase).toBeNull();
    expect(state.transitionSource).toBeNull();
  });
});
