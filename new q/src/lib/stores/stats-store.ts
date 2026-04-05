"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_STATS } from "@/lib/constants/app";
import type { AppStats } from "@/lib/types/app";
import { normalizeStats } from "@/lib/utils/normalizers";

interface StatsStore extends AppStats {
  addPomodoro: () => void;
  addRubs: (count: number) => void;
  addPages: (count: number) => void;
  resetStats: () => void;
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATS,
      addPomodoro: () =>
        set((state) => normalizeStats({ ...state, pomodoros: state.pomodoros + 1 })),
      addRubs: (count) =>
        set((state) => normalizeStats({ ...state, rubs: state.rubs + Math.max(0, count) })),
      addPages: (count) =>
        set((state) => normalizeStats({ ...state, pages: state.pages + Math.max(0, count) })),
      resetStats: () => set(DEFAULT_STATS)
    }),
    {
      name: "quranic-pomodoro-next-stats",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pomodoros: state.pomodoros,
        rubs: state.rubs,
        pages: state.pages
      }),
      merge: (persisted, current) => ({
        ...current,
        ...normalizeStats((persisted as Partial<AppStats>) ?? {})
      })
    }
  )
);
