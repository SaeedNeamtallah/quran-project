"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_READER_STATE } from "@/lib/constants/app";
import type { ReaderProgressState, ReaderRoute } from "@/lib/types/app";
import { normalizeReaderState } from "@/lib/utils/normalizers";

const READER_STORAGE_KEY = "quranic-pomodoro-next-reader";

interface ReaderStore extends ReaderProgressState {
  setCurrentRub: (value: number) => void;
  setChallengePage: (value: number) => void;
  setMushafPage: (value: number) => void;
  setLastReaderRoute: (value: ReaderRoute) => void;
}

function persistReaderSnapshot(state: ReaderProgressState) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      READER_STORAGE_KEY,
      JSON.stringify({
        state: {
          currentRub: state.currentRub,
          challengePage: state.challengePage,
          mushafPage: state.mushafPage,
          lastReaderRoute: state.lastReaderRoute
        },
        version: 0
      })
    );
  } catch {
    // Ignore storage write failures and let persist middleware try as well.
  }
}

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set) => ({
      ...DEFAULT_READER_STATE,
      setCurrentRub: (value) =>
        set((state) => {
          const nextState = normalizeReaderState({ ...state, currentRub: value });
          persistReaderSnapshot(nextState);
          return nextState;
        }),
      setChallengePage: (value) =>
        set((state) => {
          const nextState = normalizeReaderState({ ...state, challengePage: value });
          persistReaderSnapshot(nextState);
          return nextState;
        }),
      setMushafPage: (value) =>
        set((state) => {
          const nextState = normalizeReaderState({ ...state, mushafPage: value });
          persistReaderSnapshot(nextState);
          return nextState;
        }),
      setLastReaderRoute: (value) =>
        set((state) => {
          const nextState = normalizeReaderState({ ...state, lastReaderRoute: value });
          persistReaderSnapshot(nextState);
          return nextState;
        })
    }),
    {
      name: READER_STORAGE_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentRub: state.currentRub,
        challengePage: state.challengePage,
        mushafPage: state.mushafPage,
        lastReaderRoute: state.lastReaderRoute
      }),
      merge: (persisted, current) => ({
        ...current,
        ...normalizeReaderState((persisted as Partial<ReaderProgressState>) ?? {})
      })
    }
  )
);
