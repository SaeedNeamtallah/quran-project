import {
  DEFAULT_READER_STATE,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  MUSHAF_LINE_WIDTH_MODES,
  MUSHAF_PAGE_DISPLAY_COUNTS,
  MUSHAF_ZOOM_MODES,
  QURAN_FONT_SIZES,
  RUB_PAGE_SPREAD_COUNTS,
  TAFSIR_ENHANCE_PROVIDERS,
  TAFSIR_FONT_SIZES,
  TAFSIR_IDS,
  THEMES
} from "@/lib/constants/app";
import type { AppSettings, AppStats, ReaderProgressState } from "@/lib/types/app";
import type { ReadingMode } from "@/lib/types/quran";
import { isReaderRoute } from "@/lib/utils/verse";

export function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function normalizeHexColor(value: unknown, fallback = "#10b981") {
  const normalized = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

export function normalizeReadingMode(value: unknown): ReadingMode {
  return value === "page" ? "page" : "rub";
}

export function normalizeSettings(input?: Partial<AppSettings> | null): AppSettings {
  const source = input ?? {};
  const theme = source.theme ?? DEFAULT_SETTINGS.theme;
  const tafsirId = Number(source.tafsirId ?? DEFAULT_SETTINGS.tafsirId);
  const tafsirEnhanceProvider = source.tafsirEnhanceProvider ?? DEFAULT_SETTINGS.tafsirEnhanceProvider;
  const quranFontSize = source.quranFontSize ?? DEFAULT_SETTINGS.quranFontSize;
  const tafsirFontSize = source.tafsirFontSize ?? DEFAULT_SETTINGS.tafsirFontSize;

  return {
    studyDuration: clampInt(source.studyDuration, 1, 120, DEFAULT_SETTINGS.studyDuration),
    breakDuration: clampInt(source.breakDuration, 1, 60, DEFAULT_SETTINGS.breakDuration),
    dailyGoalHours: clampInt(source.dailyGoalHours, 1, 16, DEFAULT_SETTINGS.dailyGoalHours),
    rubCount: clampInt(source.rubCount, 1, 8, DEFAULT_SETTINGS.rubCount),
    rubPageSpreadCount: RUB_PAGE_SPREAD_COUNTS.includes(Number(source.rubPageSpreadCount) as (typeof RUB_PAGE_SPREAD_COUNTS)[number])
      ? Number(source.rubPageSpreadCount)
      : DEFAULT_SETTINGS.rubPageSpreadCount,
    mushafPageDisplayCount: MUSHAF_PAGE_DISPLAY_COUNTS.includes(Number(source.mushafPageDisplayCount) as (typeof MUSHAF_PAGE_DISPLAY_COUNTS)[number])
      ? Number(source.mushafPageDisplayCount)
      : DEFAULT_SETTINGS.mushafPageDisplayCount,
    mushafZoomMode: MUSHAF_ZOOM_MODES.includes(source.mushafZoomMode as AppSettings["mushafZoomMode"])
      ? (source.mushafZoomMode as AppSettings["mushafZoomMode"])
      : DEFAULT_SETTINGS.mushafZoomMode,
    mushafLineWidthMode: MUSHAF_LINE_WIDTH_MODES.includes(source.mushafLineWidthMode as AppSettings["mushafLineWidthMode"])
      ? (source.mushafLineWidthMode as AppSettings["mushafLineWidthMode"])
      : DEFAULT_SETTINGS.mushafLineWidthMode,
    theme: THEMES.includes(theme) ? (theme as AppSettings["theme"]) : DEFAULT_SETTINGS.theme,
    readingMode: normalizeReadingMode(source.readingMode),
    tafsirId: TAFSIR_IDS.includes(tafsirId as (typeof TAFSIR_IDS)[number])
      ? tafsirId
      : DEFAULT_SETTINGS.tafsirId,
    tafsirEnhanceProvider: TAFSIR_ENHANCE_PROVIDERS.includes(tafsirEnhanceProvider as (typeof TAFSIR_ENHANCE_PROVIDERS)[number])
      ? (tafsirEnhanceProvider as AppSettings["tafsirEnhanceProvider"])
      : DEFAULT_SETTINGS.tafsirEnhanceProvider,
    tafsirHighlightColor: normalizeHexColor(source.tafsirHighlightColor, DEFAULT_SETTINGS.tafsirHighlightColor),
    recitationId: clampInt(source.recitationId, 1, 1000, DEFAULT_SETTINGS.recitationId),
    verseAudioOnClick: typeof source.verseAudioOnClick === "boolean" ? source.verseAudioOnClick : DEFAULT_SETTINGS.verseAudioOnClick,
    challengeSurah: clampInt(source.challengeSurah, 1, 114, DEFAULT_SETTINGS.challengeSurah),
    quranFontSize: QURAN_FONT_SIZES.includes(quranFontSize as (typeof QURAN_FONT_SIZES)[number])
      ? String(quranFontSize)
      : DEFAULT_SETTINGS.quranFontSize,
    tafsirFontSize: TAFSIR_FONT_SIZES.includes(tafsirFontSize as (typeof TAFSIR_FONT_SIZES)[number])
      ? String(tafsirFontSize)
      : DEFAULT_SETTINGS.tafsirFontSize
  };
}

export function normalizeStats(input?: Partial<AppStats> | null): AppStats {
  const source = input ?? {};
  return {
    pomodoros: clampInt(source.pomodoros, 0, 1_000_000, DEFAULT_STATS.pomodoros),
    rubs: clampInt(source.rubs, 0, 1_000_000, DEFAULT_STATS.rubs),
    pages: clampInt(source.pages, 0, 1_000_000, DEFAULT_STATS.pages)
  };
}

export function normalizeReaderState(input?: Partial<ReaderProgressState> | null): ReaderProgressState {
  const source = input ?? {};
  const lastReaderRoute = String(source.lastReaderRoute ?? DEFAULT_READER_STATE.lastReaderRoute).trim();

  return {
    currentRub: clampInt(source.currentRub, 1, 240, DEFAULT_READER_STATE.currentRub),
    challengePage: clampInt(source.challengePage, 1, 9999, DEFAULT_READER_STATE.challengePage),
    mushafPage: clampInt(source.mushafPage, 1, 604, DEFAULT_READER_STATE.mushafPage),
    lastReaderRoute: isReaderRoute(lastReaderRoute) ? lastReaderRoute : DEFAULT_READER_STATE.lastReaderRoute
  };
}

export function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
