import { describe, expect, it } from "vitest";

import { formatTime, highlightTafsirText, splitPlainTextIntoParagraphs } from "@/lib/utils/format";

describe("format utilities", () => {
  it("formats seconds into mm:ss", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(65)).toBe("01:05");
  });

  it("splits plain tafsir text into readable paragraphs", () => {
    const paragraphs = splitPlainTextIntoParagraphs("الأول. الثاني. الثالث.\n\nالرابع.");
    expect(paragraphs).toEqual(["الأول. الثاني. الثالث.", "الرابع."]);
  });

  it("marks parenthetical fragments for highlighting", () => {
    const parts = highlightTafsirText("هذا نص (مميز) للتجربة");
    expect(parts.some((part) => part.type === "bracket" && part.text === "(مميز)")).toBe(true);
  });
});
