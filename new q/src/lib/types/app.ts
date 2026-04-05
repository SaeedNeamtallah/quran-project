import type { ReadingMode, SessionPhase } from "@/lib/types/quran";

export type ThemeName = "mint" | "pitch";

export type TafsirEnhanceProvider = "auto" | "google" | "groq";
export type ReaderRoute = "/reader/rub" | "/reader/page";
export type ReadingRendererMode = "strictMushaf" | "bigText";
export type MushafZoomMode = "stepped" | "smooth" | "quranFontSize";
export type MushafLineWidthMode = "scale" | "fixed";

export interface AppSettings {
  studyDuration: number;
  breakDuration: number;
  dailyGoalHours: number;
  rubCount: number;
  rubPageSpreadCount: number;
  mushafPageDisplayCount: number;
  mushafZoomMode: MushafZoomMode;
  mushafLineWidthMode: MushafLineWidthMode;
  theme: ThemeName;
  readingMode: ReadingMode;
  tafsirId: number;
  tafsirEnhanceProvider: TafsirEnhanceProvider;
  tafsirHighlightColor: string;
  recitationId: number;
  verseAudioOnClick: boolean;
  challengeSurah: number;
  quranFontSize: string;
  tafsirFontSize: string;
}

export interface AppStats {
  pomodoros: number;
  rubs: number;
  pages: number;
}

export interface ReaderProgressState {
  currentRub: number;
  challengePage: number;
  mushafPage: number;
  lastReaderRoute: ReaderRoute;
}

export interface FocusQuote {
  text: string;
  source: string;
  kind: "آية" | "حديث" | "مقولة";
}

export interface TimerTransition {
  completedPhase: SessionPhase;
  nextPhase: SessionPhase;
  source: "manual" | "timer";
  token: number;
}
