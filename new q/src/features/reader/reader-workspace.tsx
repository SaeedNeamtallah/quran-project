"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Timer, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { fetchPageContent, fetchRecitations, fetchRubContent, fetchRubRecitation, fetchRubWordTimings, fetchVerseAudio } from "@/lib/api/client";
import { getAppStatusQueryOptions } from "@/lib/api/app-status-query";
import type { RubRecitationTrack, VerseWordTiming } from "@/lib/types/quran";
import { usePersistedStoreHydrated } from "@/lib/hooks/use-persisted-store-hydrated";
import { cn } from "@/lib/utils/cn";
import { buildVisibleVerseKeysByPage } from "@/lib/utils/mushaf-layout";
import { getVerseReaderPath } from "@/lib/utils/verse";
import { useReaderStore } from "@/lib/stores/reader-store";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useTimerStore } from "@/lib/stores/timer-store";
import { formatTime } from "@/lib/utils/format";
import { groupPagesByVerses } from "@/components/QuranReader/ReadingView/groupPagesByVerses";
import { RubPageLayout } from "../../components/reader/rub-page-layout";

export function ReaderWorkspace() {
  const settings = useSettingsStore(
    useShallow((state) => ({
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
    }))
  );
  const patchSettings = useSettingsStore((state) => state.patchSettings);
  const currentRub = useReaderStore((state) => state.currentRub);

  const timerPhase = useTimerStore((state) => state.phase);
  const timerIsRunning = useTimerStore((state) => state.isRunning);
  const timerRemaining = useTimerStore((state) => state.remainingSeconds);
  const readerStoreHydrated = usePersistedStoreHydrated(useReaderStore);

  const rubAudioRef = useRef<HTMLAudioElement | null>(null);
  const verseAudioRef = useRef<HTMLAudioElement | null>(null);

  const [playlist, setPlaylist] = useState<RubRecitationTrack[]>([]);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [rubRecitationPlaying, setRubRecitationPlaying] = useState(false);
  const [activeRecitationVerseKey, setActiveRecitationVerseKey] = useState("");
  const [activeManualVerseKey, setActiveManualVerseKey] = useState("");
  const [activeWordSignature, setActiveWordSignature] = useState("");
  const [recitationError, setRecitationError] = useState("");
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [startingRecitationId, setStartingRecitationId] = useState<number | null>(null);

  useEffect(() => {
    if (!readerStoreHydrated) return;
    useReaderStore.getState().setLastReaderRoute(getVerseReaderPath("rub"));
  }, [readerStoreHydrated]);

  const statusQuery = useQuery(getAppStatusQueryOptions());
  const backendAvailable = Boolean(statusQuery.data?.backendAvailable);

  const readerQuery = useQuery({
    queryKey: ["reader-rub", currentRub, settings.rubCount, backendAvailable],
    queryFn: () => fetchRubContent(currentRub, settings.rubCount),
    enabled: readerStoreHydrated
  });

  const recitationsQuery = useQuery({
    queryKey: ["recitations", backendAvailable],
    queryFn: fetchRecitations,
    enabled: backendAvailable
  });

  const wordTimingsQuery = useQuery({
    queryKey: ["rub-word-timings", currentRub, settings.rubCount, settings.recitationId],
    queryFn: () => fetchRubWordTimings(currentRub, settings.rubCount, settings),
    enabled: backendAvailable && Boolean(readerQuery.data?.verses?.length)
  });

  const verses = useMemo(() => readerQuery.data?.verses ?? [], [readerQuery.data?.verses]);
  const rubPageSourcesFromApi = useMemo(() => readerQuery.data?.page_sources ?? [], [readerQuery.data?.page_sources]);
  const groupedRubPages = useMemo(() => groupPagesByVerses(verses), [verses]);
  const rubPageNumbers = useMemo(
    () =>
      rubPageSourcesFromApi.length
        ? rubPageSourcesFromApi.map((source) => source.page_number)
        : Object.keys(groupedRubPages)
            .map(Number)
            .sort((left, right) => left - right),
    [groupedRubPages, rubPageSourcesFromApi]
  );
  const visibleVerseKeysByPage = useMemo(() => buildVisibleVerseKeysByPage(verses), [verses]);
  const rubPagesQuery = useQuery({
    queryKey: ["reader-rub-pages", rubPageNumbers.join("-")],
    queryFn: () => Promise.all(rubPageNumbers.map((pageNumber) => fetchPageContent(pageNumber))),
    enabled: rubPageSourcesFromApi.length === 0 && rubPageNumbers.length > 0
  });
  const rubPageSources = useMemo(
    () =>
      rubPageSourcesFromApi.length
        ? rubPageSourcesFromApi.map((source) => ({
            pageNumber: source.page_number,
            verses: source.verses ?? [],
            visibleVerseKeys: new Set<string>(source.visible_verse_keys ?? [])
          }))
        : rubPageNumbers.map((pageNumber, index) => ({
            pageNumber,
            verses: rubPagesQuery.data?.[index]?.verses ?? [],
            visibleVerseKeys: visibleVerseKeysByPage.get(pageNumber) ?? new Set<string>()
          })),
    [rubPageNumbers, rubPageSourcesFromApi, rubPagesQuery.data, visibleVerseKeysByPage]
  );
  const navigationBusy = !readerStoreHydrated || readerQuery.isLoading || readerQuery.isFetching;
  const currentTimingMap = wordTimingsQuery.data?.word_timings ?? {};
  const recitations = recitationsQuery.data?.recitations ?? [];
  const rubLayoutLoading =
    !readerStoreHydrated ||
    readerQuery.isLoading ||
    readerQuery.isFetching ||
    (rubPageSourcesFromApi.length === 0 && rubPageNumbers.length > 0 && rubPagesQuery.isLoading);
  const rubLayoutError =
    readerQuery.error instanceof Error
      ? readerQuery.error.message
      : rubPageSourcesFromApi.length === 0 && rubPagesQuery.error instanceof Error
        ? rubPagesQuery.error.message
        : readerQuery.error || (rubPageSourcesFromApi.length === 0 ? rubPagesQuery.error : null)
          ? "تعذر تحميل موضع القراءة."
          : "";

  function stopRubRecitation() {
    if (rubAudioRef.current) {
      rubAudioRef.current.pause();
      rubAudioRef.current.removeAttribute("src");
      rubAudioRef.current.load();
    }
    setPlaylist([]);
    setPlaylistIndex(0);
    setRubRecitationPlaying(false);
    setActiveRecitationVerseKey("");
    setActiveWordSignature("");
  }

  function stopVersePreview() {
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
      verseAudioRef.current.removeAttribute("src");
      verseAudioRef.current.load();
    }
    setActiveManualVerseKey("");
  }

  async function playRubTrack(index: number, tracks = playlist) {
    if (!rubAudioRef.current || !tracks[index]) return;

    const nextTrack = tracks[index];
    setPlaylistIndex(index);
    stopVersePreview();
    setActiveManualVerseKey("");
    setActiveRecitationVerseKey(nextTrack.verse_key);
    setActiveWordSignature("");
    rubAudioRef.current.src = nextTrack.url;
    await rubAudioRef.current.play().catch(() => {});
    setRubRecitationPlaying(true);
  }

  async function handleReciterSelect(recitationId: number) {
    if (!backendAvailable) return;

    setStartingRecitationId(recitationId);
    setRecitationError("");

    try {
      stopRubRecitation();
      stopVersePreview();
      patchSettings({ recitationId });
      const payload = await fetchRubRecitation(currentRub, settings.rubCount, { ...settings, recitationId });
      setPlaylist(payload.audio_files);
      setReciterPickerOpen(false);
      await playRubTrack(0, payload.audio_files);
    } catch (error) {
      setRecitationError(error instanceof Error ? error.message : "تعذر تشغيل التلاوة.");
    } finally {
      setStartingRecitationId(null);
    }
  }

  async function handlePlayVerse(verseKey: string) {
    if (!backendAvailable || !settings.verseAudioOnClick || !verseAudioRef.current) return;

    if (activeManualVerseKey === verseKey && !verseAudioRef.current.paused) {
      stopVersePreview();
      return;
    }

    stopRubRecitation();
    stopVersePreview();
    setRecitationError("");

    try {
      const payload = await fetchVerseAudio(verseKey, settings);
      setActiveManualVerseKey(verseKey);
      verseAudioRef.current.src = payload.audio_url;
      await verseAudioRef.current.play().catch(() => {});
    } catch (error) {
      setRecitationError(error instanceof Error ? error.message : "تعذر تشغيل صوت الآية.");
    }
  }

  function handleRubEnded() {
    if (playlistIndex + 1 >= playlist.length) {
      stopRubRecitation();
      return;
    }
    void playRubTrack(playlistIndex + 1);
  }

  function handleRubTimeUpdate() {
    if (!rubAudioRef.current || !playlist.length) return;

    const currentTrack = playlist[playlistIndex];
    if (!currentTrack) return;

    setActiveRecitationVerseKey(currentTrack.verse_key);

    const verseTiming = currentTimingMap[currentTrack.verse_key] as VerseWordTiming | undefined;
    if (!verseTiming?.segments?.length) {
      setActiveWordSignature("");
      return;
    }

    const currentMs = Math.max(0, Math.round(rubAudioRef.current.currentTime * 1000));
    const activeSegment = verseTiming.segments.find((segment) => currentMs >= segment.start_ms && currentMs <= segment.end_ms);
    if (!activeSegment) {
      setActiveWordSignature("");
      return;
    }

    setActiveWordSignature(`${currentTrack.verse_key}:${activeSegment.position}`);
  }

  function handlePrevious() {
    stopRubRecitation();
    setReciterPickerOpen(false);
    let target = currentRub - settings.rubCount;
    while (target < 1) target += 240;
    useReaderStore.getState().setCurrentRub(target);
  }

  function handleNext() {
    stopRubRecitation();
    setReciterPickerOpen(false);
    const next = currentRub + settings.rubCount;
    useReaderStore.getState().setCurrentRub(next > 240 ? ((next - 1) % 240) + 1 : next);
  }

  useEffect(() => {
    stopRubRecitation();
    stopVersePreview();
    setRecitationError("");
    setReciterPickerOpen(false);
  }, [currentRub, settings.recitationId]);

  useEffect(
    () => () => {
      stopRubRecitation();
      stopVersePreview();
    },
    []
  );

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <span data-testid="reader-active-chip" className="sr-only">
        البداية من الربع {currentRub}
      </span>

      <RubPageLayout
        verses={verses}
        pageSources={rubPageSources}
        quranFontSize={settings.quranFontSize}
        mushafZoomMode={settings.mushafZoomMode}
        mushafLineWidthMode={settings.mushafLineWidthMode}
        rubPageSpreadCount={settings.rubPageSpreadCount}
        verseAudioEnabled={backendAvailable && settings.verseAudioOnClick}
        activeRecitationVerseKey={activeRecitationVerseKey}
        activeManualVerseKey={activeManualVerseKey}
        activeWordSignature={activeWordSignature}
        onPlayVerse={handlePlayVerse}
        isLoading={rubLayoutLoading}
        errorMessage={rubLayoutError}
        onRetry={() => {
          void readerQuery.refetch();
          if (rubPageSourcesFromApi.length === 0) {
            void rubPagesQuery.refetch();
          }
        }}
        recitationError={recitationError}
        navigationReady={!navigationBusy}
        onPrevious={handlePrevious}
        onNext={handleNext}
        backendAvailable={backendAvailable}
        soundState={rubRecitationPlaying ? "playing" : "idle"}
        soundTriggerTestId="reader-sound-trigger"
        onOpenReciter={() => setReciterPickerOpen(true)}
      />

      {reciterPickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 py-6 backdrop-blur-sm"
          onClick={() => setReciterPickerOpen(false)}
        >
          <div
            data-testid="reader-reciter-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-reciter-title"
            className="glass-panel w-full max-w-sm rounded-[1.5rem] px-4 py-4 shadow-halo sm:px-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="reader-reciter-title" className="text-lg font-semibold text-ink">
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

            {rubRecitationPlaying ? (
              <button
                type="button"
                data-testid="reader-stop-recitation"
                onClick={() => {
                  stopRubRecitation();
                  setReciterPickerOpen(false);
                }}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-line bg-surface/80 px-3 py-2.5 text-xs font-semibold text-ink transition hover:border-accent/30 hover:text-accent"
              >
                إيقاف التلاوة الحالية
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
                    data-testid={`reciter-option-${recitation.id}`}
                    disabled={startingRecitationId !== null}
                    onClick={() => void handleReciterSelect(recitation.id)}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded-[1.1rem] border px-3 py-3 text-right transition",
                      settings.recitationId === recitation.id
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
                        {settings.recitationId === recitation.id ? "المختار" : "تشغيل"}
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
            title={timerIsRunning ? "إيقاف المؤقت" : "استئناف المؤقت"}
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
              settings.rubPageSpreadCount === 1 ? "bg-ink text-surface shadow-sm" : "text-muted/70 hover:text-ink hover:bg-surface/50"
            )}
            aria-label="عرض صفحة واحدة"
            title="عرض صفحة واحدة"
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
              settings.rubPageSpreadCount === 2 ? "bg-ink text-surface shadow-sm" : "text-muted/70 hover:text-ink hover:bg-surface/50"
            )}
            aria-label="عرض صفحتين"
            title="عرض صفحتين"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="9" height="18" rx="1.5" />
              <rect x="13" y="3" width="9" height="18" rx="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <audio
        ref={rubAudioRef}
        data-playback-role="rub-recitation"
        preload="auto"
        className="hidden"
        onEnded={handleRubEnded}
        onPlay={() => setRubRecitationPlaying(true)}
        onPause={() => setRubRecitationPlaying(false)}
        onTimeUpdate={handleRubTimeUpdate}
      />
      <audio
        ref={verseAudioRef}
        data-playback-role="verse-preview"
        preload="none"
        className="hidden"
        onEnded={stopVersePreview}
      />
    </div>
  );
}
