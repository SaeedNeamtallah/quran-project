"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, Loader2, Minus, Plus, RefreshCcw, Volume2, Library, X } from "lucide-react";

import type { ReaderRoute } from "@/lib/types/app";
import type { QuranVerse } from "@/lib/types/quran";
import { cn } from "@/lib/utils/cn";
import {
  getQcfPageNumber,
  hasQcfV2Layout
} from "@/lib/utils/mushaf-layout";
import ReadingView, { type ReadingViewEntry } from "@/components/QuranReader/ReadingView";
import { buildReadingLinesForPage } from "@/components/QuranReader/ReadingView/groupLinesByVerses";


interface RubPageEntry {
  fontPageNumber: number;
  displayPageNumber: number;
  verses: QuranVerse[];
  visibleVerseKeys: ReadonlySet<string>;
  layoutReady: boolean;
}

interface RubPageSource {
  pageNumber: number;
  verses: QuranVerse[];
  visibleVerseKeys: ReadonlySet<string>;
}

interface RubPageLayoutProps {
  verses: QuranVerse[];
  pageSources?: RubPageSource[];
  quranFontSize: string;
  mushafZoomMode: "stepped" | "smooth" | "quranFontSize";
  mushafLineWidthMode: "scale" | "fixed";
  rubPageSpreadCount: number;
  verseAudioEnabled: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  recitationError?: string;
  navigationReady?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  backendAvailable?: boolean;
  soundState?: "playing" | "idle";
  soundTriggerTestId?: string;
  onOpenReciter?: () => void;

}

function isRightSidePage(pageNumber: number) {
  return pageNumber % 2 === 1;
}

function buildRubPageEntries(pageSources: RubPageSource[]) {
  return pageSources.map(({ pageNumber, verses: pageVerses, visibleVerseKeys }) => {
    const fontPageNumber = getQcfPageNumber(pageVerses, pageNumber);
    return {
      fontPageNumber,
      displayPageNumber: pageNumber,
      verses: pageVerses,
      visibleVerseKeys,
      layoutReady: hasQcfV2Layout(pageVerses)
    } satisfies RubPageEntry;
  });
}

export function RubPageLayout({
  verses,
  pageSources = [],
  quranFontSize,
  mushafZoomMode,
  mushafLineWidthMode,
  rubPageSpreadCount,
  verseAudioEnabled,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  isLoading = false,
  errorMessage = "",
  onRetry,
  recitationError = "",
  navigationReady = false,
  onPrevious,
  onNext,
  backendAvailable = false,
  soundState = "idle",
  soundTriggerTestId = "reader-sound-trigger",
  onOpenReciter

}: RubPageLayoutProps) {
  const scaleIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pageScale, setPageScale] = useState(0.6);
  const [scaleIndicatorVisible, setScaleIndicatorVisible] = useState(false);
  const [scaleIndicatorValue, setScaleIndicatorValue] = useState(0.6);
  const [showTafsirHint, setShowTafsirHint] = useState(false);

  const pageEntries = useMemo(() => buildRubPageEntries(pageSources), [pageSources]);
  const readingViewEntries = useMemo<ReadingViewEntry[]>(
    () =>
      pageEntries.map((entry) => ({
        displayPageNumber: entry.displayPageNumber,
        fontPageNumber: entry.fontPageNumber,
        verses: entry.verses,
        visibleVerseKeys: entry.visibleVerseKeys
      })),
    [pageEntries]
  );
  const pageLinesReady =
    pageEntries.length > 0 &&
    pageEntries.every((entry) => buildReadingLinesForPage(entry.verses, entry.fontPageNumber).length > 0);
  const pageRendererReady = pageLinesReady;
  const canIncreasePageScale = mushafZoomMode !== "quranFontSize" && pageScale < 1.25;
  const canDecreasePageScale = mushafZoomMode !== "quranFontSize" && pageScale > 0.5;
  const scaleIndicatorLabel = `${Math.round(scaleIndicatorValue * 100)}%`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(
    () => () => {
      if (scaleIndicatorTimeoutRef.current) {
        clearTimeout(scaleIndicatorTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!scaleIndicatorVisible) return;

    if (scaleIndicatorTimeoutRef.current) {
      clearTimeout(scaleIndicatorTimeoutRef.current);
    }

    scaleIndicatorTimeoutRef.current = setTimeout(() => {
      setScaleIndicatorVisible(false);
    }, 1200);

    return () => {
      if (scaleIndicatorTimeoutRef.current) {
        clearTimeout(scaleIndicatorTimeoutRef.current);
        scaleIndicatorTimeoutRef.current = null;
      }
    };
  }, [scaleIndicatorVisible, scaleIndicatorValue]);

  function handleIncreasePageScale() {
    setPageScale((value) => {
      const nextValue = Math.min(1.25, Number((value + 0.05).toFixed(2)));
      if (nextValue !== value) {
        setScaleIndicatorValue(nextValue);
        setScaleIndicatorVisible(true);
      }
      return nextValue;
    });
  }

  function handleDecreasePageScale() {
    setPageScale((value) => {
      const nextValue = Math.max(0.5, Number((value - 0.05).toFixed(2)));
      if (nextValue !== value) {
        setScaleIndicatorValue(nextValue);
        setScaleIndicatorVisible(true);
      }
      return nextValue;
    });
  }

  function handleTafsirClick() {
    setShowTafsirHint(true);
  }

  return (
    <div className="grid gap-2" dir="rtl">
      {recitationError ? <p className="mx-auto mb-3 max-w-4xl text-xs leading-6 text-rose-700">{recitationError}</p> : null}

      {isLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : errorMessage ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <p className="max-w-xl text-xs leading-7 text-muted">{errorMessage}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent/30 hover:text-accent"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              إعادة المحاولة
            </button>
          ) : null}
        </div>
      ) : pageRendererReady ? (
        <ReadingView
          entries={readingViewEntries}
          pageScale={pageScale}
          quranFontSize={quranFontSize}
          mushafZoomMode={mushafZoomMode}
          mushafLineWidthMode={mushafLineWidthMode}
          spreadCount={rubPageSpreadCount}
          verseAudioEnabled={verseAudioEnabled}
          activeRecitationVerseKey={activeRecitationVerseKey}
          activeManualVerseKey={activeManualVerseKey}
          activeWordSignature={activeWordSignature}
          onPlayVerse={onPlayVerse}
          stageTestId="reader-page-stage"
          pageTestIdBuilder={(entry) => `reader-page-sheet-${entry.displayPageNumber}`}
          wordTestIdPrefix="word"
          ayahTestIdPrefix="mushaf-ayah"
          lineTestIdBuilder={(entry, _entryIndex, lineNumber) => `reader-page-${entry.displayPageNumber}-line-${lineNumber}`}
          showPageNumber
        />
      ) : (
        <div className="grid gap-4">
          <div className="rounded-[1.2rem] border border-line/70 bg-surface/65 px-4 py-4 text-xs leading-7 text-muted">
            لا توجد بيانات QCF V2 صالحة أو مجمعة سطريًا لبناء هذا الربع الآن.
          </div>
        </div>
      )}

      {pageRendererReady ? (
        <div className="fixed bottom-8 right-4 z-40 flex flex-col items-center gap-1.5 md:bottom-6">

          <div
            aria-live="polite"
            className={cn(
              "rounded-full border border-line/70 bg-surface/92 px-2.5 py-1 text-[10px] font-semibold text-ink shadow-halo backdrop-blur-xl transition-all duration-200",
              scaleIndicatorVisible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
            )}
          >
            الحجم {scaleIndicatorLabel}
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={handleIncreasePageScale}
              disabled={!canIncreasePageScale}
              aria-label="تكبير الصفحة"
              title="تكبير الصفحة"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-halo backdrop-blur-xl transition",
                canIncreasePageScale
                  ? "border-line bg-surface/88 text-ink hover:border-accent/30 hover:text-accent"
                  : "cursor-not-allowed border-line/60 bg-surface/60 text-muted"
              )}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDecreasePageScale}
              disabled={!canDecreasePageScale}
              aria-label="تصغير الصفحة"
              title="تصغير الصفحة"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-halo backdrop-blur-xl transition",
                canDecreasePageScale
                  ? "border-line bg-surface/88 text-ink hover:border-accent/30 hover:text-accent"
                  : "cursor-not-allowed border-line/60 bg-surface/60 text-muted"
              )}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onPrevious}
              disabled={!navigationReady}
              aria-label="الموضع السابق"
              title="الموضع السابق"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-halo backdrop-blur-xl transition",
                navigationReady
                  ? "border-line bg-surface/88 text-ink hover:border-accent/30 hover:text-accent"
                  : "cursor-not-allowed border-line/60 bg-surface/60 text-muted"
              )}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!navigationReady}
              aria-label="الموضع التالي"
              title="الموضع التالي"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-halo backdrop-blur-xl transition",
                navigationReady
                  ? "border-line bg-surface/88 text-ink hover:border-accent/30 hover:text-accent"
                  : "cursor-not-allowed border-line/60 bg-surface/60 text-muted"
              )}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              data-testid={soundTriggerTestId}
              data-recitation-state={soundState}
              aria-label="تشغيل التلاوة"
              title="تشغيل التلاوة"
              disabled={!backendAvailable}
              onClick={onOpenReciter}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-halo backdrop-blur-xl transition",
                backendAvailable
                  ? soundState === "playing"
                    ? "border-accent/30 bg-accent/12 text-accent hover:bg-accent/18"
                    : "border-line bg-surface/88 text-ink hover:border-accent/30 hover:text-accent"
                  : "cursor-not-allowed border-line/60 bg-surface/60 text-muted"
              )}
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleTafsirClick}
              aria-label="التفسير"
              title="التفسير"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-halo backdrop-blur-xl transition",
                "border-line bg-surface/88 text-ink hover:border-accent/30 hover:text-accent"
              )}
            >
              <Library className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {showTafsirHint ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-md transition-all"
          onClick={() => setShowTafsirHint(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-[1.5rem] border border-line/60 bg-surface p-7 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Library className="h-7 w-7" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-ink">تلميح</h3>
            <p className="mb-8 text-sm font-medium leading-relaxed text-ink/80">
              يمكنك عرض تفسير أي آية في أي وقت بالضغط على رقمها مباشرة في القراءة.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowTafsirHint(false);
                const firstVerseKey = verses[0]?.verse_key || "1:1";
                router.push(`/tafsir/${firstVerseKey}`);
              }}
              className="inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-3.5 text-sm font-bold text-surface shadow-md transition hover:bg-ink/80 active:scale-95"
            >
              متابعة للتفسير
            </button>
            <button
              type="button"
              onClick={() => setShowTafsirHint(false)}
              aria-label="إغلاق التلميح"
              title="إغلاق"
              className="absolute left-5 top-5 text-muted hover:text-ink transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
