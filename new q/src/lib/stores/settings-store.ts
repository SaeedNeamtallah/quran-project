"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_SETTINGS } from "@/lib/constants/app";
import type { AppSettings, ThemeName } from "@/lib/types/app";
import type { ReadingMode } from "@/lib/types/quran";
import { normalizeSettings } from "@/lib/utils/normalizers";

interface SettingsStore extends AppSettings {
  patchSettings: (patch: Partial<AppSettings>) => void;
  setTheme: (theme: ThemeName) => void;
  setReadingMode: (readingMode: ReadingMode) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      patchSettings: (patch) => {
        set((state) => {
          const updated = { ...state, ...patch };
          return normalizeSettings(updated);
        });
      },
      setTheme: (theme) => {
        set((state) => {
          return normalizeSettings({ ...state, theme });
        });
      },
      setReadingMode: (readingMode) => {
        set((state) => {
          return normalizeSettings({ ...state, readingMode });
        });
      },
      resetSettings: () => set(() => DEFAULT_SETTINGS)
    }),
    {
      name: "quranic-pomodoro-next-settings",
      storage: createJSONStorage(() => {
        // Safely access localStorage
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            return window.localStorage;
          }
        } catch (e) {
          console.warn("localStorage unavailable:", e);
        }
        // Fallback to a dummy storage if localStorage fails
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as any;
      }),
      partialize: (state) => ({
        studyDuration: state.studyDuration,
        breakDuration: state.breakDuration,
        dailyGoalHours: state.dailyGoalHours,
        rubCount: state.rubCount,
        rubPageSpreadCount: state.rubPageSpreadCount,
        mushafPageDisplayCount: state.mushafPageDisplayCount,
        mushafZoomMode: state.mushafZoomMode,
        mushafLineWidthMode: state.mushafLineWidthMode,
        theme: state.theme,
        readingMode: state.readingMode,
        tafsirId: state.tafsirId,
        tafsirEnhanceProvider: state.tafsirEnhanceProvider,
        tafsirHighlightColor: state.tafsirHighlightColor,
        recitationId: state.recitationId,
        verseAudioOnClick: state.verseAudioOnClick,
        challengeSurah: state.challengeSurah,
        quranFontSize: state.quranFontSize,
        tafsirFontSize: state.tafsirFontSize
      }),
      merge: (persisted, current) => ({
        ...current,
        ...normalizeSettings((persisted as Partial<AppSettings>) ?? {})
      })
    }
  )
);
