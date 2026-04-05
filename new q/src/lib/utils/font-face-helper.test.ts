import { describe, expect, it } from "vitest";

import {
  DEFAULT_MUSHAF_LINES,
  DEFAULT_QURAN_FONT,
  FALLBACK_FONT,
  getFontFaceNameForPage,
  getFontClassName,
  getLineWidthClassName,
  getQCFFontFaceSource,
  getReadingFontScale,
  getReadingRendererMode,
  resolveReadingPresentation
} from "@/lib/utils/font-face-helper";

describe("font-face-helper", () => {
  it("always keeps the reading renderer in strict mushaf mode", () => {
    expect(getReadingRendererMode(0.6)).toBe("strictMushaf");
    expect(getReadingRendererMode(0.75)).toBe("strictMushaf");
    expect(getReadingRendererMode(1.05)).toBe("strictMushaf");
  });

  it("maps page scale to the expected font scale buckets", () => {
    expect(getReadingFontScale(0.5)).toBe(1);
    expect(getReadingFontScale(0.58)).toBe(2);
    expect(getReadingFontScale(0.6)).toBe(3);
    expect(getReadingFontScale(0.74)).toBe(4);
    expect(getReadingFontScale(0.9)).toBe(6);
    expect(getReadingFontScale(1)).toBe(8);
    expect(getReadingFontScale(1.2)).toBe(10);
  });

  it("resolves stepped, smooth, and quranFontSize reading presentation modes", () => {
    expect(
      resolveReadingPresentation({
        pageScale: 0.9,
        quranFontSize: "2.3rem",
        mushafZoomMode: "stepped",
        mushafLineWidthMode: "fixed"
      })
    ).toMatchObject({
      readingRendererMode: "strictMushaf",
      fontScale: 6,
      lineWidthScale: 3,
      fontSizeMultiplier: 1,
      lineWidthMultiplier: 1
    });

    expect(
      resolveReadingPresentation({
        pageScale: 0.9,
        quranFontSize: "2.3rem",
        mushafZoomMode: "smooth",
        mushafLineWidthMode: "scale"
      })
    ).toMatchObject({
      readingRendererMode: "strictMushaf",
      fontScale: 3,
      lineWidthScale: 3,
      fontSizeMultiplier: 1.5,
      lineHeightMultiplier: 1.5,
      lineWidthMultiplier: 1.5
    });

    expect(
      resolveReadingPresentation({
        pageScale: 0.6,
        quranFontSize: "2.9rem",
        mushafZoomMode: "quranFontSize",
        mushafLineWidthMode: "fixed"
      })
    ).toMatchObject({
      readingRendererMode: "strictMushaf",
      fontScale: 3,
      lineWidthScale: 3,
      fontSizeMultiplier: 1.2609,
      lineHeightMultiplier: 1.2609,
      lineWidthMultiplier: 1
    });
  });

  it("builds the page font identifiers used by the reading renderer", () => {
    expect(getFontFaceNameForPage(DEFAULT_QURAN_FONT, 8)).toBe("p8-v2");
    expect(getQCFFontFaceSource(DEFAULT_QURAN_FONT, 8)).toContain("local('QCF2008')");
    expect(getQCFFontFaceSource(DEFAULT_QURAN_FONT, 8)).toContain("/hafs/v2/woff2/p8.woff2");
    expect(getQCFFontFaceSource(DEFAULT_QURAN_FONT, 8)).toContain("/hafs/v2/woff/p8.woff");
    expect(getQCFFontFaceSource(DEFAULT_QURAN_FONT, 8)).toContain("/hafs/v2/ttf/p8.ttf");
    expect(getFontClassName(DEFAULT_QURAN_FONT, 3, DEFAULT_MUSHAF_LINES)).toBe("code_v2-font-size-3");
    expect(getFontClassName(FALLBACK_FONT, 3, DEFAULT_MUSHAF_LINES, true)).toBe("fallback_qpc_uthmani_hafs-font-size-3");
    expect(getLineWidthClassName(DEFAULT_QURAN_FONT, 3, DEFAULT_MUSHAF_LINES)).toBe("code_v2-line-width-3");
    expect(getLineWidthClassName(FALLBACK_FONT, 3, DEFAULT_MUSHAF_LINES, true)).toBe("fallback_qpc_uthmani_hafs-line-width-3");
  });
});
