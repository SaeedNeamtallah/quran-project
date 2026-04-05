"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TimerTransition } from "@/lib/types/app";
import type { SessionPhase } from "@/lib/types/quran";

interface TimerDurations {
  studySeconds: number;
  breakSeconds: number;
}

interface TimerStore {
  phase: SessionPhase;
  isRunning: boolean;
  remainingSeconds: number;
  endAt: number | null;
  lastTransitionAt: number | null;
  lastCompletedPhase: SessionPhase | null;
  transitionSource: TimerTransition["source"] | null;
  transitionToken: number;
  hydrateDurations: (durations: TimerDurations) => void;
  acknowledgeTransition: (token: number) => void;
  start: () => void;
  pause: () => void;
  reset: (durations: TimerDurations) => void;
  skip: (durations: TimerDurations) => void;
  tick: (durations: TimerDurations) => void;
}

function getPhaseDuration(durations: TimerDurations, phase: SessionPhase) {
  return phase === "study" ? durations.studySeconds : durations.breakSeconds;
}

function getNextPhase(phase: SessionPhase): SessionPhase {
  return phase === "study" ? "break" : "study";
}

function shouldAutoStartPhase(phase: SessionPhase) {
  return true;
}

function getSafeRemaining(endAt: number | null, fallback: number) {
  if (!endAt) return fallback;
  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      phase: "study",
      isRunning: false,
      remainingSeconds: 30 * 60,
      endAt: null,
      lastTransitionAt: null,
      lastCompletedPhase: null,
      transitionSource: null,
      transitionToken: 0,
      hydrateDurations: (durations) =>
        set((state) => {
          if (state.isRunning) return state;
          return {
            ...state,
            remainingSeconds: getPhaseDuration(durations, state.phase)
          };
        }),
      acknowledgeTransition: (token) =>
        set((state) => {
          if (state.transitionToken !== token || !state.lastCompletedPhase) {
            return state;
          }
          return {
            ...state,
            lastCompletedPhase: null,
            transitionSource: null
          };
        }),
      start: () =>
        set((state) => {
          if (state.isRunning) return state;
          return {
            ...state,
            isRunning: true,
            endAt: Date.now() + state.remainingSeconds * 1000
          };
        }),
      pause: () =>
        set((state) => {
          if (!state.isRunning) return state;
          return {
            ...state,
            isRunning: false,
            remainingSeconds: getSafeRemaining(state.endAt, state.remainingSeconds),
            endAt: null
          };
        }),
      reset: (durations) =>
        set((state) => ({
          ...state,
          isRunning: false,
          endAt: null,
          remainingSeconds: getPhaseDuration(durations, state.phase)
        })),
      skip: (durations) =>
        set((state) => {
          const transitionAt = Date.now();
          const nextPhase = getNextPhase(state.phase);
          const nextPhaseDuration = getPhaseDuration(durations, nextPhase);
          const shouldAutoStart = shouldAutoStartPhase(nextPhase);
          return {
            ...state,
            phase: nextPhase,
            isRunning: shouldAutoStart,
            endAt: shouldAutoStart ? transitionAt + nextPhaseDuration * 1000 : null,
            remainingSeconds: nextPhaseDuration,
            lastTransitionAt: transitionAt,
            lastCompletedPhase: state.phase,
            transitionSource: "manual",
            transitionToken: state.transitionToken + 1
          };
        }),
      tick: (durations) => {
        const state = get();
        if (!state.isRunning) return;

        const remainingSeconds = getSafeRemaining(state.endAt, state.remainingSeconds);
        if (remainingSeconds > 0) {
          set({ remainingSeconds });
          return;
        }

        const nextPhase = getNextPhase(state.phase);
        const nextPhaseDuration = getPhaseDuration(durations, nextPhase);
        const shouldAutoStart = shouldAutoStartPhase(nextPhase);
        const transitionAt = Date.now();
        set({
          phase: nextPhase,
          isRunning: shouldAutoStart,
          endAt: shouldAutoStart ? transitionAt + nextPhaseDuration * 1000 : null,
          remainingSeconds: nextPhaseDuration,
          lastTransitionAt: transitionAt,
          lastCompletedPhase: state.phase,
          transitionSource: "timer",
          transitionToken: state.transitionToken + 1
        });
      }
    }),
    {
      name: "quranic-pomodoro-next-timer",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        phase: state.phase,
        isRunning: state.isRunning,
        remainingSeconds: state.remainingSeconds,
        endAt: state.endAt,
        lastTransitionAt: state.lastTransitionAt,
        lastCompletedPhase: state.lastCompletedPhase,
        transitionSource: state.transitionSource,
        transitionToken: state.transitionToken
      })
    }
  )
);
