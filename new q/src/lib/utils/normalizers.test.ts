import { describe, expect, it } from "vitest";

import { normalizeReaderState, normalizeSettings } from "@/lib/utils/normalizers";

describe("normalizers", () => {
  it("falls back to safe defaults when settings are invalid", () => {
    const normalized = normalizeSettings({
      studyDuration: -5,
      breakDuration: 200,
      rubPageSpreadCount: 99,
      mushafPageDisplayCount: 99,
      theme: "unknown" as never,
      tafsirHighlightColor: "bad-color"
    });

    expect(normalized.studyDuration).toBe(1);
    expect(normalized.breakDuration).toBe(60);
    expect(normalized.rubPageSpreadCount).toBe(1);
    expect(normalized.mushafPageDisplayCount).toBe(1);
    expect(normalized.theme).toBe("mint");
    expect(normalized.tafsirHighlightColor).toBe("#10b981");
  });

  it("normalizes reader route state", () => {
    const normalized = normalizeReaderState({
      currentRub: 999,
      challengePage: -1,
      lastReaderRoute: "/other" as never
    });

    expect(normalized.currentRub).toBe(240);
    expect(normalized.challengePage).toBe(1);
    expect(normalized.lastReaderRoute).toBe("/reader/rub");
  });

  it("keeps supported reader routes and reading modes", () => {
    const normalized = normalizeSettings({
      readingMode: "page"
    });
    const readerState = normalizeReaderState({
      lastReaderRoute: "/reader/page"
    });

    expect(normalized.readingMode).toBe("page");
    expect(readerState.lastReaderRoute).toBe("/reader/page");
  });
});
