import type { MushafLineWidthMode, MushafZoomMode, ReadingRendererMode } from "@/lib/types/app";
import {
  MushafLines,
  QuranFont,
  type MushafLines as MushafLinesType,
  type QuranFont as QuranFontType
} from "@/lib/types/quran-reader";

export const QCF_FONT_VERSION = "v2";
export const FALLBACK_FONT_FAMILY = "UthmanicHafs, var(--font-quran)";
export const READING_FONT_SCALE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const DEFAULT_QURAN_FONT: QuranFontType = QuranFont.MadaniV2;
export const FALLBACK_FONT: QuranFontType = QuranFont.FallbackQpcUthmaniHafs;
export const DEFAULT_MUSHAF_LINES: MushafLinesType = MushafLines.FifteenLines;
export const DEFAULT_READING_PAGE_SCALE = 0.6;
export const DEFAULT_READING_FONT_SCALE: ReadingFontScale = 3;
export const DEFAULT_READING_QURAN_FONT_SIZE_REM = 2.3;

export type ReadingFontScale = (typeof READING_FONT_SCALE_LEVELS)[number];

export interface ReadingPresentation {
  readingRendererMode: ReadingRendererMode;
  fontScale: ReadingFontScale;
  lineWidthScale: ReadingFontScale;
  fontSizeMultiplier: number;
  lineHeightMultiplier: number;
  lineWidthMultiplier: number;
}

export function getFontFaceNameForPage(quranFont: QuranFontType, pageNumber: number) {
  if (quranFont !== QuranFont.MadaniV2) {
    return `p${pageNumber}-${quranFont}`;
  }

  return `p${pageNumber}-${QCF_FONT_VERSION}`;
}

export function getQCFFontFaceSource(quranFont: QuranFontType, pageNumber: number) {
  const pageName = String(pageNumber).padStart(3, "0");
  const basePath = `https://verses.quran.foundation/fonts/quran/hafs/${QCF_FONT_VERSION}`;

  if (quranFont !== QuranFont.MadaniV2) {
    return "";
  }

  return [
    `local('QCF2${pageName}')`,
    `url('${basePath}/woff2/p${pageNumber}.woff2') format('woff2')`,
    `url('${basePath}/woff/p${pageNumber}.woff') format('woff')`,
    `url('${basePath}/ttf/p${pageNumber}.ttf') format('truetype')`
  ].join(", ");
}

export function getFontClassName(
  quranFont: QuranFontType,
  fontScale: ReadingFontScale,
  mushafLines: MushafLinesType,
  isFallbackFont = false
) {
  if (quranFont === QuranFont.MadaniV2) {
    return isFallbackFont
      ? `fallback_${FALLBACK_FONT}-font-size-${fontScale}`
      : `${quranFont}-font-size-${fontScale}`;
  }

  if (quranFont === QuranFont.FallbackQpcUthmaniHafs) {
    return isFallbackFont
      ? `fallback_${quranFont}-font-size-${fontScale}`
      : `${quranFont}-font-size-${fontScale}`;
  }

  return `${quranFont}_${mushafLines}-font-size-${fontScale}`;
}

export function getLineWidthClassName(
  quranFont: QuranFontType,
  fontScale: ReadingFontScale,
  mushafLines: MushafLinesType,
  isFallbackFont = false
) {
  if (quranFont === QuranFont.MadaniV2) {
    return isFallbackFont
      ? `fallback_${FALLBACK_FONT}-line-width-${fontScale}`
      : `${quranFont}-line-width-${fontScale}`;
  }

  if (quranFont === QuranFont.FallbackQpcUthmaniHafs) {
    return isFallbackFont
      ? `fallback_${quranFont}-line-width-${fontScale}`
      : `${quranFont}-line-width-${fontScale}`;
  }

  return `${quranFont}_${mushafLines}-line-width-${fontScale}`;
}

export function getReadingRendererMode(pageScale: number): ReadingRendererMode {
  return "strictMushaf";
}

export function getReadingFontScale(pageScale: number): ReadingFontScale {
  if (pageScale <= 0.52) return 1;
  if (pageScale <= 0.58) return 2;
  if (pageScale <= 0.66) return 3;
  if (pageScale <= 0.74) return 4;
  if (pageScale <= 0.82) return 5;
  if (pageScale <= 0.9) return 6;
  if (pageScale <= 0.98) return 7;
  if (pageScale <= 1.06) return 8;
  if (pageScale <= 1.14) return 9;
  return 10;
}

function clampMultiplier(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Number(value.toFixed(4));
}

function parseRemValue(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_READING_QURAN_FONT_SIZE_REM;
}

export function resolveReadingPresentation({
  pageScale,
  quranFontSize,
  mushafZoomMode,
  mushafLineWidthMode
}: {
  pageScale: number;
  quranFontSize: string;
  mushafZoomMode: MushafZoomMode;
  mushafLineWidthMode: MushafLineWidthMode;
}): ReadingPresentation {
  const readingRendererMode = getReadingRendererMode(pageScale);

  if (mushafZoomMode === "stepped") {
    const fontScale = getReadingFontScale(pageScale);
    return {
      readingRendererMode,
      fontScale,
      lineWidthScale: mushafLineWidthMode === "fixed" ? DEFAULT_READING_FONT_SCALE : fontScale,
      fontSizeMultiplier: 1,
      lineHeightMultiplier: 1,
      lineWidthMultiplier: 1
    };
  }

  const zoomFactor =
    mushafZoomMode === "smooth"
      ? clampMultiplier(pageScale / DEFAULT_READING_PAGE_SCALE)
      : clampMultiplier(parseRemValue(quranFontSize) / DEFAULT_READING_QURAN_FONT_SIZE_REM);

  return {
    readingRendererMode,
    fontScale: DEFAULT_READING_FONT_SCALE,
    lineWidthScale: DEFAULT_READING_FONT_SCALE,
    fontSizeMultiplier: zoomFactor,
    lineHeightMultiplier: zoomFactor,
    lineWidthMultiplier: mushafLineWidthMode === "fixed" ? 1 : zoomFactor
  };
}
