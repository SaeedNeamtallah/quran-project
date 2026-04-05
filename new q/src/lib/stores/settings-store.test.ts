import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/lib/constants/app";
import { useSettingsStore } from "@/lib/stores/settings-store";

describe("settings store", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetSettings();
  });

  it("normalizes invalid patches and persists valid changes", () => {
    useSettingsStore.getState().patchSettings({
      studyDuration: -4,
      breakDuration: 999,
      rubPageSpreadCount: 9,
      mushafPageDisplayCount: 9,
      theme: "unknown" as never,
      readingMode: "page",
      recitationId: 0,
      verseAudioOnClick: false
    });

    const state = useSettingsStore.getState();

    expect(state.studyDuration).toBe(1);
    expect(state.breakDuration).toBe(60);
    expect(state.rubPageSpreadCount).toBe(DEFAULT_SETTINGS.rubPageSpreadCount);
    expect(state.mushafPageDisplayCount).toBe(DEFAULT_SETTINGS.mushafPageDisplayCount);
    expect(state.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(state.readingMode).toBe("page");
    expect(state.recitationId).toBe(1);
    expect(state.verseAudioOnClick).toBe(false);

    const persisted = localStorage.getItem("quranic-pomodoro-next-settings");
    expect(persisted).toContain("\"readingMode\":\"page\"");
  });

  it("restores the defaults on reset", () => {
    useSettingsStore.getState().patchSettings({
      studyDuration: 50,
      rubCount: 3,
      challengeSurah: 55
    });

    useSettingsStore.getState().resetSettings();

    expect(useSettingsStore.getState()).toMatchObject(DEFAULT_SETTINGS);
  });
});
