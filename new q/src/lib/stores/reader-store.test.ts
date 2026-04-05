import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_READER_STATE } from "@/lib/constants/app";
import { useReaderStore } from "@/lib/stores/reader-store";

describe("reader store", () => {
  beforeEach(() => {
    localStorage.clear();
    useReaderStore.setState(DEFAULT_READER_STATE);
  });

  it("clamps navigation state and rejects invalid reader routes", () => {
    useReaderStore.getState().setCurrentRub(999);
    useReaderStore.getState().setChallengePage(-3);
    useReaderStore.getState().setMushafPage(900);
    useReaderStore.getState().setLastReaderRoute("/focus" as never);

    const state = useReaderStore.getState();

    expect(state.currentRub).toBe(240);
    expect(state.challengePage).toBe(1);
    expect(state.mushafPage).toBe(604);
    expect(state.lastReaderRoute).toBe(DEFAULT_READER_STATE.lastReaderRoute);
  });

  it("persists valid reader routes", () => {
    useReaderStore.getState().setLastReaderRoute("/reader/page");

    expect(useReaderStore.getState().lastReaderRoute).toBe("/reader/page");

    const persisted = localStorage.getItem("quranic-pomodoro-next-reader");
    expect(persisted).toContain("\"lastReaderRoute\":\"/reader/page\"");
  });
});
