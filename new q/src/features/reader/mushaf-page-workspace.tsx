"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, Loader2, Minus, Plus, RefreshCcw, Timer, Volume2, X, Library } from "lucide-react";
import Link from "next/link";

import {
  fetchPageContent,
  fetchPageRecitation,
  fetchPageWordTimings,
  fetchRecitations,
  fetchVerseAudio
} from "@/lib/api/client";
import { getAppStatusQueryOptions } from "@/lib/api/app-status-query";
import { usePersistedStoreHydrated } from "@/lib/hooks/use-persisted-store-hydrated";
import { useReaderStore } from "@/lib/stores/reader-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import type { RubRecitationTrack, VerseWordTiming } from "@/lib/types/quran";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/format";
import { useTimerStore } from "@/lib/stores/timer-store";
import {
  getQcfPageNumber,
  hasQcfV2Layout
} from "@/lib/utils/mushaf-layout";
import ReadingView, { type ReadingViewEntry } from "@/components/QuranReader/ReadingView";
import { buildReadingLinesForPage } from "@/components/QuranReader/ReadingView/groupLinesByVerses";


function wrapMushafPageNumber(pageNumber: number) {
  if (pageNumber < 1) return 604 + pageNumber;
  if (pageNumber > 604) return pageNumber - 604;
  return pageNumber;
}

export function MushafPageWorkspace() {
  const router = useRouter();
  const mushafPage = useReaderStore((state) => state.mushafPage);
  const readerStoreHydrated = usePersistedStoreHydrated(useReaderStore);
  const patchSettings = useSettingsStore((state) => state.patchSettings);
  const verseAudioOnClick = useSettingsStore((state) => state.verseAudioOnClick);
  const recitationId = useSettingsStore((state) => state.recitationId);
  const quranFontSize = useSettingsStore((state) => state.quranFontSize);
  const mushafZoomMode = useSettingsStore((state) => state.mushafZoomMode);
  const mushafLineWidthMode = useSettingsStore((state) => state.mushafLineWidthMode);
  const mushafPageSpreadCount = useSettingsStore((state) => state.rubPageSpreadCount);
  const mushafPageDisplayCount = useSettingsStore((state) => state.mushafPageDisplayCount);

  const timerPhase = useTimerStore((state) => state.phase);
  const timerIsRunning = useTimerStore((state) => state.isRunning);
  const timerRemaining = useTimerStore((state) => state.remainingSeconds);

  const pageAudioRef = useRef<HTMLAudioElement | null>(null);
  const verseAudioRef = useRef<HTMLAudioElement | null>(null);
  const scaleIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playlist, setPlaylist] = useState<RubRecitationTrack[]>([]);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [pageRecitationPlaying, setPageRecitationPlaying] = useState(false);
  const [activeVerseKey, setActiveVerseKey] = useState("");
  const [activeRecitationVerseKey, setActiveRecitationVerseKey] = useState("");
  const [activeWordSignature, setActiveWordSignature] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [recitationError, setRecitationError] = useState("");
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [startingRecitationId, setStartingRecitationId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pageScale, setPageScale] = useState(0.6);
  const [scaleIndicatorVisible, setScaleIndicatorVisible] = useState(false);
  const [scaleIndicatorValue, setScaleIndicatorValue] = useState(0.6);
  const [showTafsirHint, setShowTafsirHint] = useState(false);



  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!readerStoreHydrated) return;
    useReaderStore.getState().setLastReaderRoute("/reader/page");
  }, [readerStoreHydrated]);

  const statusQuery = useQuery(getAppStatusQueryOptions());
  const backendAvailable = Boolean(statusQuery.data?.backendAvailable);
  const visiblePageNumbers = useMemo(
    () =>
      Array.from({ length: Math.max(1, Math.min(3, mushafPageDisplayCount)) }, (_, index) =>
        wrapMushafPageNumber(mushafPage + index)
      ),
    [mushafPage, mushafPageDisplayCount]
  );

  const pageQuery = useQuery({
    queryKey: ["reader-page-layout", visiblePageNumbers.join("-"), backendAvailable],
    queryFn: () => Promise.all(visiblePageNumbers.map((pageNumber) => fetchPageContent(pageNumber))),
    enabled: readerStoreHydrated
  });

  const recitationsQuery = useQuery({
    queryKey: ["recitations", backendAvailable],
    queryFn: fetchRecitations,
    enabled: backendAvailable
  });

  const pageWordTimingsQuery = useQuery({
    queryKey: ["page-word-timings", mushafPage, recitationId],
    queryFn: () =>
      fetchPageWordTimings(mushafPage, {
        ...useSettingsStore.getState(),
        recitationId
      }),
    enabled: backendAvailable && Boolean(pageQuery.data?.[0]?.verses?.length)
  });

  const pageEntries = useMemo(
    () =>
      visiblePageNumbers.map((pageNumber, index) => {
        const verses = pageQuery.data?.[index]?.verses ?? [];
        const displayPageNumber = getQcfPageNumber(verses, pageNumber);

        return {
          sourcePageNumber: pageNumber,
          verses,
          layoutReady: hasQcfV2Layout(verses),
          displayPageNumber
        };
      }),
    [pageQuery.data, visiblePageNumbers]
  );
  const readingViewEntries = useMemo<ReadingViewEntry[]>(
    () =>
      pageEntries.map((entry) => ({
        displayPageNumber: entry.displayPageNumber,
        fontPageNumber: entry.displayPageNumber,
        verses: entry.verses
      })),
    [pageEntries]
  );
  const primaryPageEntry = pageEntries[0];
  const verses = useMemo(() => pageEntries.flatMap((entry) => entry.verses), [pageEntries]);
  const pageLinesReady =
    pageEntries.length > 0 &&
    pageEntries.every((entry) => buildReadingLinesForPage(entry.verses, entry.displayPageNumber).length > 0);
  const layoutReady = pageEntries.length > 0 && pageEntries.every((entry) => entry.layoutReady);
  const displayPageNumber = primaryPageEntry?.displayPageNumber ?? mushafPage;
  const navigationReady = mounted && readerStoreHydrated;
  const currentTimingMap = pageWordTimingsQuery.data?.word_timings ?? {};
  const recitations = recitationsQuery.data?.recitations ?? [];
  const canIncreasePageScale = mushafZoomMode !== "quranFontSize" && pageScale < 1.25;
  const canDecreasePageScale = mushafZoomMode !== "quranFontSize" && pageScale > 0.5;
  const pageRendererReady = pageLinesReady;
  const readingSpreadCount = mushafPageSpreadCount >= 2 ? 2 : 1;
  const scaleIndicatorLabel = `${Math.round(scaleIndicatorValue * 100)}%`;

  function stopPageRecitation() {
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
      pageAudioRef.current.removeAttribute("src");
      pageAudioRef.current.load();
    }
    setPlaylist([]);
    setPlaylistIndex(0);
    setPageRecitationPlaying(false);
    setActiveRecitationVerseKey("");
    setActiveWordSignature("");
  }

  function stopPreview() {
    if (!verseAudioRef.current) return;
    verseAudioRef.current.pause();
    verseAudioRef.current.removeAttribute("src");
    verseAudioRef.current.load();
    setActiveVerseKey("");
  }

  async function playPageTrack(index: number, tracks = playlist) {
    if (!pageAudioRef.current || !tracks[index]) return;

    const nextTrack = tracks[index];
    setPlaylistIndex(index);
    stopPreview();
    setPreviewError("");
    setActiveRecitationVerseKey(nextTrack.verse_key);
    setActiveWordSignature("");
    pageAudioRef.current.src = nextTrack.url;
    await pageAudioRef.current.play().catch(() => {});
    setPageRecitationPlaying(true);
  }

  async function handleReciterSelect(nextRecitationId: number) {
    if (!backendAvailable) return;

    setStartingRecitationId(nextRecitationId);
    setRecitationError("");

    try {
      stopPageRecitation();
      stopPreview();
      patchSettings({ recitationId: nextRecitationId });
      const payload = await fetchPageRecitation(mushafPage, {
        ...useSettingsStore.getState(),
        recitationId: nextRecitationId
      });
      setPlaylist(payload.audio_files);
      setReciterPickerOpen(false);
      await playPageTrack(0, payload.audio_files);
    } catch (error) {
      setRecitationError(error instanceof Error ? error.message : "تعذر تشغيل تلاوة الصفحة.");
    } finally {
      setStartingRecitationId(null);
    }
  }

  async function handlePreviewVerse(verseKey: string) {
    if (!backendAvailable || !verseAudioOnClick || !verseAudioRef.current) return;

    if (activeVerseKey === verseKey && !verseAudioRef.current.paused) {
      stopPreview();
      return;
    }

    setPreviewError("");
    stopPageRecitation();
    stopPreview();

    try {
      const payload = await fetchVerseAudio(verseKey, {
        ...useSettingsStore.getState(),
        recitationId
      });
      setActiveVerseKey(verseKey);
      verseAudioRef.current.src = payload.audio_url;
      await verseAudioRef.current.play().catch(() => {});
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "تعذر تشغيل صوت الآية.");
    }
  }

  function handlePageEnded() {
    if (playlistIndex + 1 >= playlist.length) {
      stopPageRecitation();
      return;
    }
    void playPageTrack(playlistIndex + 1);
  }

  function handlePageTimeUpdate() {
    if (!pageAudioRef.current || !playlist.length) return;

    const currentTrack = playlist[playlistIndex];
    if (!currentTrack) return;

    setActiveRecitationVerseKey(currentTrack.verse_key);

    const verseTiming = currentTimingMap[currentTrack.verse_key] as VerseWordTiming | undefined;
    if (!verseTiming?.segments?.length) {
      setActiveWordSignature("");
      return;
    }

    const currentMs = Math.max(0, Math.round(pageAudioRef.current.currentTime * 1000));
    const activeSegment = verseTiming.segments.find((segment) => currentMs >= segment.start_ms && currentMs <= segment.end_ms);

    if (!activeSegment) {
      setActiveWordSignature("");
      return;
    }

    setActiveWordSignature(`${currentTrack.verse_key}:${activeSegment.position}`);
  }

  function handlePrevious() {
    if (!navigationReady) return;
    stopPageRecitation();
    stopPreview();
    setReciterPickerOpen(false);
    const step = Math.max(1, Math.min(3, mushafPageDisplayCount));
    useReaderStore.getState().setMushafPage(wrapMushafPageNumber(mushafPage - step));
  }

  function handleNext() {
    if (!navigationReady) return;
    stopPageRecitation();
    stopPreview();
    setReciterPickerOpen(false);
    const step = Math.max(1, Math.min(3, mushafPageDisplayCount));
    useReaderStore.getState().setMushafPage(wrapMushafPageNumber(mushafPage + step));
  }

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

  useEffect(() => {
    stopPageRecitation();
    stopPreview();
    setPreviewError("");
    setRecitationError("");
    setReciterPickerOpen(false);
  }, [mushafPage, recitationId]);

  useEffect(() => {
    if (!reciterPickerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReciterPickerOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reciterPickerOpen]);

  useEffect(
    () => () => {
      if (scaleIndicatorTimeoutRef.current) {
        clearTimeout(scaleIndicatorTimeoutRef.current);
      }
      stopPageRecitation();
      stopPreview();
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

  return (
    <div className="flex min-h-0 flex-1 flex-col" dir="rtl">
      <section className="min-h-0 flex-1 overflow-x-auto overflow-y-auto px-1 py-1 sm:px-2">
        {previewError ? <p className="mx-auto mb-3 max-w-4xl text-xs leading-6 text-rose-700">{previewError}</p> : null}
        {recitationError ? <p className="mx-auto mb-3 max-w-4xl text-xs leading-6 text-rose-700">{recitationError}</p> : null}

        {(!readerStoreHydrated || pageQuery.isLoading) ? (
          <div className="flex min-h-[50vh] items-center justify-center text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : pageQuery.error ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
            <p className="max-w-xl text-xs leading-7 text-muted">
              {pageQuery.error instanceof Error ? pageQuery.error.message : "تعذر تحميل صفحات المصحف."}
            </p>
            <button
              type="button"
              onClick={() => pageQuery.refetch()}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent/30 hover:text-accent"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              إعادة المحاولة
            </button>
          </div>
        ) : pageRendererReady ? (
          <ReadingView
            entries={readingViewEntries}
            pageScale={pageScale}
            quranFontSize={quranFontSize}
            mushafZoomMode={mushafZoomMode}
            mushafLineWidthMode={mushafLineWidthMode}
            spreadCount={readingSpreadCount}
            verseAudioEnabled={backendAvailable && verseAudioOnClick}
            activeRecitationVerseKey={activeRecitationVerseKey}
            activeManualVerseKey={activeVerseKey}
            activeWordSignature={activeWordSignature}
            onPlayVerse={(verseKey) => void handlePreviewVerse(verseKey)}
            stageTestId="mushaf-page-stage"
            pageTestIdBuilder={(entry, index) =>
              readingSpreadCount === 1 && index === 0 ? "mushaf-page-sheet" : `mushaf-page-sheet-${entry.displayPageNumber}`
            }
            wordTestIdPrefix="mushaf-word"
            ayahTestIdPrefix="mushaf-ayah"
            lineTestIdBuilder={(entry, index, lineNumber) =>
              readingSpreadCount === 1 && index === 0
                ? `mushaf-line-${lineNumber}`
                : `mushaf-page-${entry.displayPageNumber}-line-${lineNumber}`
            }
            showPageNumber
          />
        ) : (
          <div className="grid gap-4">
            <div className="rounded-[1.2rem] border border-line/70 bg-surface/65 px-4 py-4 text-xs leading-7 text-muted">
              لا توجد بيانات QCF V2 صالحة أو مجمعة سطريًا لبناء هذه الصفحة الآن.
            </div>
          </div>
        )}
      </section>

      {pageRendererReady ? (
        <>

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
              onClick={handlePrevious}
              disabled={!navigationReady}
              aria-label="الصفحة السابقة"
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
              onClick={handleNext}
              disabled={!navigationReady}
              aria-label="الصفحة التالية"
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
              data-testid="mushaf-sound-trigger"
              data-recitation-state={pageRecitationPlaying ? "playing" : "idle"}
              aria-label="تشغيل تلاوة الصفحة"
              disabled={!backendAvailable}
              onClick={() => setReciterPickerOpen(true)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-halo backdrop-blur-xl transition",
                backendAvailable
                  ? pageRecitationPlaying
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
        </>
      ) : null}

      {/* Reading countdown timer — bottom-left */}
      {timerPhase === "break" ? (
        <span
          className={cn(
            "fixed bottom-6 left-4 z-40 text-sm font-bold tabular-nums transition md:left-6",
            timerIsRunning ? "text-accent" : "text-muted"
          )}
        >
          {formatTime(timerRemaining)}
        </span>
      ) : null}

      {reciterPickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 py-6 backdrop-blur-sm"
          onClick={() => setReciterPickerOpen(false)}
        >
          <div
            data-testid="mushaf-reciter-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mushaf-reciter-title"
            className="glass-panel w-full max-w-sm rounded-[1.5rem] px-4 py-4 shadow-halo sm:px-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="mushaf-reciter-title" className="text-lg font-semibold text-ink">
                اختر الشيخ
              </h2>
              <button
                type="button"
                onClick={() => setReciterPickerOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/80 text-muted transition hover:border-accent/30 hover:text-accent"
                aria-label="إغلاق اختيار الشيخ"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {pageRecitationPlaying ? (
              <button
                type="button"
                data-testid="mushaf-stop-recitation"
                onClick={() => {
                  stopPageRecitation();
                  setReciterPickerOpen(false);
                }}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-line bg-surface/80 px-3 py-2.5 text-xs font-semibold text-ink transition hover:border-accent/30 hover:text-accent"
              >
                إيقاف تلاوة الصفحة
              </button>
            ) : null}

            <div className="mt-4 grid max-h-[55vh] gap-1.5 overflow-y-auto">
              {recitationsQuery.isLoading ? (
                <div className="flex items-center justify-center py-6 text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : recitationsQuery.isError ? (
                <p className="text-xs leading-6 text-muted">تعذر تحميل قائمة الشيوخ الآن.</p>
              ) : (
                recitations.map((recitation) => (
                  <button
                    key={recitation.id}
                    type="button"
                    data-testid={`mushaf-reciter-option-${recitation.id}`}
                    disabled={startingRecitationId !== null}
                    onClick={() => void handleReciterSelect(recitation.id)}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded-[1.1rem] border px-3 py-3 text-right transition",
                      recitationId === recitation.id
                        ? "border-accent/25 bg-accent/8 text-ink"
                        : "border-line bg-surface/80 text-ink hover:border-accent/30 hover:bg-surface",
                      startingRecitationId !== null && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <span className="grid gap-0.5">
                      <span className="text-xs font-semibold">{recitation.label}</span>
                      <span className="text-[11px] text-muted">{recitation.name}</span>
                    </span>
                    {startingRecitationId === recitation.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                    ) : (
                      <span className="rounded-full bg-mist px-2.5 py-0.5 text-[10px] font-semibold text-muted">
                        {recitationId === recitation.id ? "المختار" : "تشغيل"}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {recitationError ? <p className="mt-3 text-xs leading-6 text-rose-700">{recitationError}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-3 md:bottom-6 md:left-6 transition-all duration-300">
        {timerPhase === "break" ? (
          <button
            type="button"
            onClick={() => {
              if (timerIsRunning) {
                useTimerStore.getState().pause();
              } else {
                useTimerStore.getState().start();
              }
            }}
            className={cn(
              "text-sm font-bold tabular-nums transition hover:scale-105 active:scale-95 cursor-pointer",
              timerIsRunning ? "text-accent" : "text-muted opacity-60"
            )}
            aria-label={timerIsRunning ? "إيقاف المؤقت" : "استئناف المؤقت"}
          >
            {formatTime(timerRemaining)}
          </button>
        ) : null}

        <div className="flex items-center gap-1 rounded-full border border-line/50 bg-surface/40 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => patchSettings({ rubPageSpreadCount: 1 })}
            className={cn(
              "flex h-6 w-8 items-center justify-center rounded-full transition-all duration-200",
              mushafPageSpreadCount === 1 ? "bg-ink text-surface shadow-sm" : "text-muted/70 hover:text-ink hover:bg-surface/50"
            )}
            aria-label="عرض عمودي"
            title="عرض عمودي"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => patchSettings({ rubPageSpreadCount: 2 })}
            className={cn(
              "flex h-6 w-8 items-center justify-center rounded-full transition-all duration-200",
              mushafPageSpreadCount === 2 ? "bg-ink text-surface shadow-sm" : "text-muted/70 hover:text-ink hover:bg-surface/50"
            )}
            aria-label="عرض مزدوج"
            title="عرض مزدوج"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="9" height="18" rx="1.5" />
              <rect x="13" y="3" width="9" height="18" rx="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <audio
        ref={pageAudioRef}
        data-playback-role="mushaf-page-recitation"
        preload="auto"
        className="hidden"
        onEnded={handlePageEnded}
        onPlay={() => setPageRecitationPlaying(true)}
        onPause={() => setPageRecitationPlaying(false)}
        onTimeUpdate={handlePageTimeUpdate}
      />
      <audio
        ref={verseAudioRef}
        data-playback-role="mushaf-page-preview"
        preload="none"
        className="hidden"
        onEnded={stopPreview}
      />

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
              يمكنك عرض تفسير أي آية في أي وقت بالضغط على رقمها مباشرة في المصحف.
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
              aria-label="إغلاق التلميح"
              onClick={() => setShowTafsirHint(false)}
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
