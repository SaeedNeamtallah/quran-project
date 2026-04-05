"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, Clock, Target, Gauge } from "lucide-react";

import { FOCUS_QUOTES } from "@/lib/constants/app";
import { cn } from "@/lib/utils/cn";
import { primeGlobalAlarm } from "@/lib/utils/alarm-bridge";
import { formatTime } from "@/lib/utils/format";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useTimerStore } from "@/lib/stores/timer-store";
import { useReaderStore } from "@/lib/stores/reader-store";

/* ------------------------------------------------------------------ */
/*  Tiny inline dropdown used for each setting pill                    */
/* ------------------------------------------------------------------ */

interface DropdownOption<TValue extends string | number = number> {
  value: TValue;
  label: string;
}

function SettingPill<TValue extends string | number>({
  icon: Icon,
  label,
  displayValue,
  options,
  selectedValue,
  onSelect,
  testId
}: {
  icon: typeof Target;
  label: string;
  displayValue: string;
  options: DropdownOption<TValue>[];
  selectedValue: TValue;
  onSelect: (value: TValue) => void;
  testId?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative" data-testid={testId}>
      <button
        type="button"
        dir="rtl"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex flex-row-reverse items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur-xl transition",
          open
            ? "border-accent/30 bg-accent/8 text-accent"
            : "border-white/15 bg-white/5 text-ink/70 hover:border-white/25 hover:bg-white/8 hover:text-ink"
        )}
      >
        <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform", open && "rotate-180")} />
        <span className="max-w-[7rem] truncate">{displayValue}</span>
        <Icon className="h-3 w-3 opacity-60" />
      </button>

      {open ? (
        <div dir="rtl" className="absolute right-0 top-full z-50 mt-1.5 min-w-[13rem] max-h-60 overflow-y-auto rounded-xl border border-line/70 bg-surface py-1.5 shadow-halo backdrop-blur-2xl">
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold tracking-wider text-muted">
            {label}
          </p>
          {options.map((option) => {
            const isActive = option.value === selectedValue;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-right text-sm transition",
                  isActive ? "bg-accent/12 font-bold text-accent" : "text-ink hover:bg-mist"
                )}
              >
                <span className="flex-1">{option.label}</span>
                {isActive ? <span className="text-xs text-accent">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main workspace                                                     */
/* ------------------------------------------------------------------ */

export function FocusWorkspace() {
  const studyDuration = useSettingsStore((state) => state.studyDuration);
  const breakDuration = useSettingsStore((state) => state.breakDuration);
  const dailyGoalHours = useSettingsStore((state) => state.dailyGoalHours);
  const readingMode = useSettingsStore((state) => state.readingMode);
  const rubCount = useSettingsStore((state) => state.rubCount);
  const mushafPageDisplayCount = useSettingsStore((state) => state.mushafPageDisplayCount);
  const patchSettings = useSettingsStore((state) => state.patchSettings);

  const phase = useTimerStore((state) => state.phase);
  const isRunning = useTimerStore((state) => state.isRunning);
  const remainingSeconds = useTimerStore((state) => state.remainingSeconds);
  const start = useTimerStore((state) => state.start);
  const pause = useTimerStore((state) => state.pause);
  const hydrateDurations = useTimerStore((state) => state.hydrateDurations);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [hasTouchedCurrentPhase, setHasTouchedCurrentPhase] = useState(false);
  const [fitScale, setFitScale] = useState(1);
  const [scaledFrameSize, setScaledFrameSize] = useState({ width: 0, height: 0 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /* ---- derived data ---- */

  const durations = useMemo(
    () => ({
      studySeconds: studyDuration * 60,
      breakSeconds: breakDuration * 60
    }),
    [breakDuration, studyDuration]
  );

  const goalOptions = useMemo<DropdownOption[]>(
    () => Array.from({ length: 16 }, (_, i) => ({ value: i + 1, label: `${i + 1} ساعة` })),
    []
  );

  const studyOptions = useMemo<DropdownOption[]>(
    () => [5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map((m) => ({ value: m, label: `${m} دقيقة` })),
    []
  );

  const breakOptions = useMemo<DropdownOption[]>(
    () => [5, 10, 15, 20, 30, 45, 60].map((m) => ({ value: m, label: `${m} دقيقة` })),
    []
  );

  const challengeModeOptions = useMemo<DropdownOption<string>[]>(() => {
    const pageOptions: DropdownOption<string>[] = [
      { value: "page:1", label: "صفحة واحدة" },
      { value: "page:2", label: "صفحتان" },
      { value: "page:3", label: "3 صفحات" }
    ];

    const rubOptions: DropdownOption<string>[] = Array.from({ length: 8 }, (_, index) => {
      const count = index + 1;
      if (count === 1) return { value: `rub:${count}`, label: "ربع واحد" };
      if (count === 2) return { value: `rub:${count}`, label: "ربعان" };
      return { value: `rub:${count}`, label: `${count} أرباع` };
    });

    return [...pageOptions, ...rubOptions];
  }, []);

  const challengeModeDisplayValue = useMemo(() => {
    if (readingMode === "page") {
      if (mushafPageDisplayCount === 2) return "صفحتان";
      if (mushafPageDisplayCount === 3) return "3 صفحات";
      return "صفحة";
    }

    if (rubCount === 2) return "ربعان";
    if (rubCount >= 3) return `${rubCount} أرباع`;
    return "ربع";
  }, [mushafPageDisplayCount, readingMode, rubCount]);

  const selectedChallengeOption = readingMode === "page" ? `page:${mushafPageDisplayCount}` : `rub:${rubCount}`;




  /* ---- effects ---- */

  /* Sync timer with new durations when changed (only while paused) */
  useEffect(() => {
    hydrateDurations(durations);
  }, [durations, hydrateDurations]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % FOCUS_QUOTES.length);
    }, 120000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { setHasTouchedCurrentPhase(false); }, [phase]);
  useEffect(() => { if (isRunning) setHasTouchedCurrentPhase(true); }, [isRunning]);

  useEffect(() => {
    const updateFitScale = () => {
      const viewport = viewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) return;

      const availableWidth = Math.max(0, viewport.clientWidth - 12);
      const availableHeight = Math.max(0, viewport.clientHeight - 12);
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;

      if (!availableWidth || !availableHeight || !contentWidth || !contentHeight) {
        setFitScale(1);
        setScaledFrameSize({ width: 0, height: 0 });
        return;
      }

      const nextScale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight);
      const safeScale = Number.isFinite(nextScale) && nextScale > 0 ? Number(nextScale.toFixed(3)) : 1;

      setFitScale(safeScale);
      setScaledFrameSize({
        width: Math.ceil(contentWidth * safeScale),
        height: Math.ceil(contentHeight * safeScale)
      });
    };

    updateFitScale();

    const resizeObserver = new ResizeObserver(updateFitScale);
    if (viewportRef.current) resizeObserver.observe(viewportRef.current);
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    window.addEventListener("resize", updateFitScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFitScale);
    };
  }, []);

  /* ---- computed ---- */

  const currentQuote = FOCUS_QUOTES[quoteIndex];
  const totalSeconds = phase === "study" ? durations.studySeconds : durations.breakSeconds;
  const progress = Math.max(0, Math.min(100, (remainingSeconds / Math.max(1, totalSeconds)) * 100));
  const isStudyPhase = phase === "study";
  const isInitialStudyState = isStudyPhase && !isRunning && remainingSeconds === durations.studySeconds && !hasTouchedCurrentPhase;
  const canToggleTimer = remainingSeconds > 0;
  const timerLabel = phase === "study" ? "وقت التركيز" : "وقت القرآن";
  const timerHint = isRunning
    ? "اضغط على الدائرة لإيقاف المؤقت"
    : isInitialStudyState
      ? "اضغط على الدائرة لبدء الجلسة"
      : "اضغط على الدائرة لتشغيل المؤقت";
  const timerAccent = !isRunning ? "rgb(var(--ink))" : isStudyPhase ? "#10b981" : "#06b6d4";
  const timerTrack = !isRunning ? "rgb(var(--mist))" : "rgb(var(--line) / 0.35)";
  const timerShadow = !isRunning ? "none" : isStudyPhase ? "0 30px 80px rgba(16, 185, 129, 0.18)" : "0 30px 80px rgba(6, 182, 212, 0.18)";
  const hasScaledFrameSize = scaledFrameSize.width > 0 && scaledFrameSize.height > 0;
  const scaledFrameWidth = hasScaledFrameSize ? `${scaledFrameSize.width}px` : "auto";
  const scaledFrameHeight = hasScaledFrameSize ? `${scaledFrameSize.height}px` : "auto";

  async function handleTimerPress() {
    if (!canToggleTimer) return;
    setHasTouchedCurrentPhase(true);

    if (isRunning) {
      pause();
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    await primeGlobalAlarm();
    start();
  }

  function handleDurationChange(type: "study" | "break", minutes: number) {
    const newDurations = {
      studySeconds: type === "study" ? minutes * 60 : durations.studySeconds,
      breakSeconds: type === "break" ? minutes * 60 : durations.breakSeconds
    };
    patchSettings(type === "study" ? { studyDuration: minutes } : { breakDuration: minutes });
    useTimerStore.getState().reset(newDurations);
    useTimerStore.getState().start();
  }

  /* ---- render ---- */

  return (
    <section className="relative flex h-full min-h-0 flex-1 items-stretch overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[12%] h-44 w-44 rounded-full bg-accent/10 blur-3xl sm:h-56 sm:w-56" />
        <div className="absolute right-[10%] top-[18%] h-36 w-36 rounded-full bg-surface/45 blur-3xl sm:h-48 sm:w-48" />
        <div className="absolute bottom-[8%] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl sm:h-72 sm:w-72" />
      </div>

      {/* Right-side setting pills — small, transparent, non-intrusive */}
      <div className="pointer-events-auto absolute right-3 top-3 z-30 flex flex-col items-end gap-1.5 sm:right-5 sm:top-4">
        <SettingPill
          icon={Target}
          label="الهدف اليومي"
          displayValue={`${dailyGoalHours} ساعة`}
          options={goalOptions}
          selectedValue={dailyGoalHours}
          onSelect={(v) => patchSettings({ dailyGoalHours: v })}
          testId="focus-goal-pill"
        />
        <SettingPill
          icon={Clock}
          label="مدة المذاكرة"
          displayValue={`مذاكرة ${studyDuration}د`}
          options={studyOptions}
          selectedValue={studyDuration}
          onSelect={(v) => handleDurationChange("study", v)}
          testId="focus-study-pill"
        />
        <SettingPill
          icon={Clock}
          label="مدة القراءة"
          displayValue={`قراءة ${breakDuration}د`}
          options={breakOptions}
          selectedValue={breakDuration}
          onSelect={(v) => handleDurationChange("break", v)}
          testId="focus-break-pill"
        />
        <SettingPill
          icon={BookOpen}
          label="وضع التحدي"
          displayValue={challengeModeDisplayValue}
          options={challengeModeOptions}
          selectedValue={selectedChallengeOption}
          onSelect={(v) => {
            if (typeof v !== "string") return;
            const [modeRaw, countRaw] = v.split(":");
            const count = Number(countRaw);
            if (!Number.isInteger(count)) return;

            const newMode = modeRaw === "page" ? "page" : "rub";

            patchSettings(
              newMode === "page"
                ? { readingMode: "page", mushafPageDisplayCount: count }
                : { readingMode: "rub", rubCount: count }
            );
            useReaderStore.getState().setLastReaderRoute(newMode === "page" ? "/reader/page" : "/reader/rub");
          }}
          testId="focus-mode-pill"
        />

        <Link
          href="/stats"
          dir="rtl"
          className="mt-1 flex flex-row-reverse items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-ink/70 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/8 hover:text-ink"
        >
          <span className="max-w-[7rem] truncate">الإحصاءات</span>
          <Gauge className="h-3 w-3 opacity-60" />
        </Link>

      </div>

      {/* Timer — centered as before */}
      <div ref={viewportRef} className="relative mx-auto flex h-full w-full items-center justify-center overflow-hidden py-2 sm:py-4">
        <div className="focus-scaled-frame flex items-center justify-center">
          <div
            ref={contentRef}
            className="focus-scaled-content group flex w-[min(92vw,44rem)] min-h-0 flex-col items-center justify-center gap-4 px-2 text-center sm:gap-6 sm:px-3"
          >
            <button
              type="button"
              data-testid="focus-timer-trigger"
              onClick={() => void handleTimerPress()}
              disabled={!canToggleTimer}
              aria-label={isRunning ? "أوقف المؤقت" : isInitialStudyState ? "ابدأ جلسة التركيز" : "شغّل المؤقت"}
              className={cn(
                "focus-timer-button relative grid aspect-square w-full max-w-[min(100%,clamp(12rem,28vw,20rem))] place-items-center rounded-full border border-white/70 transition",
                canToggleTimer
                  ? "cursor-pointer hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 active:scale-[0.99]"
                  : "cursor-default"
              )}
            >
              <div className="focus-timer-inner absolute inset-[clamp(0.35rem,0.8vw,0.55rem)] rounded-full" />
              <div className="relative flex flex-col items-center gap-2 text-center">
                <span className="text-xs font-medium text-ink/40">{timerLabel}</span>
                <span className="text-[clamp(2.4rem,6vw,3.8rem)] font-semibold tracking-tight text-ink">
                  {isInitialStudyState ? "ابدأ" : formatTime(remainingSeconds)}
                </span>
              </div>
            </button>

            <p className="text-[clamp(0.85rem,1.45vw,1rem)] font-medium text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">{timerHint}</p>
            <p
              className="quran-text max-w-full px-2 text-[clamp(1.1rem,2.1vw,2.1rem)] font-bold leading-snug tracking-tight text-ink"
              title={currentQuote.text}
            >
              {currentQuote.text}
            </p>
            <p className="text-[clamp(0.72rem,1vw,0.85rem)] font-semibold text-muted">
              {currentQuote.source}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .focus-scaled-frame {
          width: ${scaledFrameWidth};
          height: ${scaledFrameHeight};
        }

        .focus-scaled-content {
          transform: scale(${fitScale});
          transform-origin: center center;
        }

        .focus-timer-button {
          background: conic-gradient(${timerAccent} ${progress}%, ${timerTrack} ${progress}% 100%);
          box-shadow: ${timerShadow};
        }

        .focus-timer-inner {
          background: #f0fdf9;
        }
      `}</style>
    </section>
  );
}
