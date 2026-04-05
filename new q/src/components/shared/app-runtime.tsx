"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { playGlobalAlarm, registerAlarmController } from "@/lib/utils/alarm-bridge";
import { usePersistedStoreHydrated } from "@/lib/hooks/use-persisted-store-hydrated";
import { applyThemeAttributes } from "@/lib/utils/theme";
import { isReaderRoute } from "@/lib/utils/verse";
import { useReaderStore } from "@/lib/stores/reader-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useStatsStore } from "@/lib/stores/stats-store";
import { useTimerStore } from "@/lib/stores/timer-store";

function notifyPhaseSwitch(isStudyPhase: boolean) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const title = isStudyPhase ? "⏱ وقت التركيز" : "📖 استراحة قرآنية";
  const body = isStudyPhase ? "رجعنا لوضع الإنجاز الهادئ." : "حان وقت القراءة الهادئة.";

  try {
    new Notification(title, { body });
  } catch {
    // Ignore notification failures.
  }
}

export function AppRuntime() {
  const router = useRouter();
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const primedRef = useRef(false);
  const handledTransitionRef = useRef(0);
  const previousPathnameRef = useRef(pathname);

  const theme = useSettingsStore((state) => state.theme);
  const rubCount = useSettingsStore((state) => state.rubCount);
  const mushafPageDisplayCount = useSettingsStore((state) => state.mushafPageDisplayCount);
  const studyDuration = useSettingsStore((state) => state.studyDuration);
  const breakDuration = useSettingsStore((state) => state.breakDuration);
  const readingMode = useSettingsStore((state) => state.readingMode);
  const readerStoreHydrated = usePersistedStoreHydrated(useReaderStore);

  const phase = useTimerStore((state) => state.phase);
  const tick = useTimerStore((state) => state.tick);
  const acknowledgeTransition = useTimerStore((state) => state.acknowledgeTransition);
  const transitionToken = useTimerStore((state) => state.transitionToken);
  const lastCompletedPhase = useTimerStore((state) => state.lastCompletedPhase);
  const transitionSource = useTimerStore((state) => state.transitionSource);

  const addPomodoro = useStatsStore((state) => state.addPomodoro);
  const addRubs = useStatsStore((state) => state.addRubs);
  const addPages = useStatsStore((state) => state.addPages);

  useEffect(() => {
    applyThemeAttributes(theme);
  }, [theme]);

  useEffect(() => {
    if (readerStoreHydrated || !useReaderStore.persist?.rehydrate) return;
    void useReaderStore.persist.rehydrate();
  }, [readerStoreHydrated]);

  useEffect(() => {
    if (isReaderRoute(pathname)) {
      if (!readerStoreHydrated) return;
      useReaderStore.getState().setLastReaderRoute(pathname);
    }
  }, [pathname, readerStoreHydrated]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      tick({
        studySeconds: studyDuration * 60,
        breakSeconds: breakDuration * 60
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [breakDuration, studyDuration, tick]);

  useEffect(() => {
    previousPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    registerAlarmController({
      prime: async () => {
        if (!audioRef.current || primedRef.current) return;
        try {
          audioRef.current.muted = true;
          await audioRef.current.play().catch(() => {});
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.muted = false;
          primedRef.current = true;
        } catch {
          if (audioRef.current) {
            audioRef.current.muted = false;
          }
        }
      },
      play: () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    if (!transitionToken || handledTransitionRef.current === transitionToken || !lastCompletedPhase) return;

    handledTransitionRef.current = transitionToken;

    if (lastCompletedPhase === "study") {
      addPomodoro();
      // Advance reader position based on settings
      if (readingMode === "page") {
        const step = Math.max(1, Math.min(3, mushafPageDisplayCount));
        const next = useReaderStore.getState().mushafPage + step;
        useReaderStore.getState().setMushafPage(next > 604 ? ((next - 1) % 604) + 1 : next);
      } else {
        const next = useReaderStore.getState().currentRub + rubCount;
        useReaderStore.getState().setCurrentRub(next > 240 ? ((next - 1) % 240) + 1 : next);
      }
    } else {
      if (readingMode === "page") {
        addPages(Math.max(1, Math.min(3, mushafPageDisplayCount)));
      } else {
        addRubs(rubCount);
      }
    }

    if (transitionSource === "timer") {
      playGlobalAlarm();
    }

    notifyPhaseSwitch(phase === "study");

    const targetPath = phase === "break" ? useReaderStore.getState().lastReaderRoute : "/focus";
    acknowledgeTransition(transitionToken);
    if (pathname !== targetPath) {
      router.replace(targetPath);
    }
  }, [acknowledgeTransition, addPomodoro, addRubs, addPages, pathname, phase, router, rubCount, mushafPageDisplayCount, readingMode, transitionSource, transitionToken, lastCompletedPhase]);

  return <audio ref={audioRef} src="/alarm.m4a" preload="auto" className="hidden" />;
}
