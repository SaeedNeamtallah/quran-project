"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ArrowDown, Plus, Minus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { TAFSIR_FONT_SIZES, TAFSIR_OPTIONS } from "@/lib/constants/app";
import { enhanceTafsir, fetchTafsir, loadVerseSequence } from "@/lib/api/client";
import { getAppStatusQueryOptions } from "@/lib/api/app-status-query";
import { cn } from "@/lib/utils/cn";
import { decodeVerseKeyParam, getTafsirPath } from "@/lib/utils/verse";
import { formatVerseMarker, highlightTafsirText, parseSacredTexts, splitPlainTextIntoParagraphs } from "@/lib/utils/format";
import { buildTafsirBlocks } from "@/lib/utils/tafsir";
import { useReaderStore } from "@/lib/stores/reader-store";
import { useSettingsStore } from "@/lib/stores/settings-store";

function stepTafsirFontSize(currentValue: string, direction: 1 | -1) {
  const index = Math.max(0, TAFSIR_FONT_SIZES.indexOf(currentValue as (typeof TAFSIR_FONT_SIZES)[number]));
  const nextIndex = Math.min(TAFSIR_FONT_SIZES.length - 1, Math.max(0, index + direction));
  return TAFSIR_FONT_SIZES[nextIndex];
}

export function TafsirWorkspace({ verseKey: rawVerseKey }: { verseKey: string }) {
  const router = useRouter();
  const verseKey = decodeVerseKeyParam(rawVerseKey);

  const settings = useSettingsStore(useShallow((state) => ({
    rubPageSpreadCount: state.rubPageSpreadCount,
    mushafPageDisplayCount: state.mushafPageDisplayCount,
    mushafZoomMode: state.mushafZoomMode,
    mushafLineWidthMode: state.mushafLineWidthMode,
    tafsirId: state.tafsirId,
    tafsirEnhanceProvider: state.tafsirEnhanceProvider,
    tafsirHighlightColor: state.tafsirHighlightColor,
    tafsirFontSize: state.tafsirFontSize
  })));
  const patchSettings = useSettingsStore((state) => state.patchSettings);
  const lastReaderRoute = useReaderStore((state) => state.lastReaderRoute);

  const [enhancedSegments, setEnhancedSegments] = useState<string[] | null>(null);
  const [enhanceState, setEnhanceState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [enhanceError, setEnhanceError] = useState("");
  const enhanceResetTimerRef = useRef<number | null>(null);

  const statusQuery = useQuery(getAppStatusQueryOptions());

  const tafsirQuery = useQuery({
    queryKey: ["tafsir", verseKey, settings.tafsirId],
    queryFn: () =>
      fetchTafsir(verseKey, {
        studyDuration: 30,
        breakDuration: 15,
        dailyGoalHours: 1,
        rubCount: 1,
        theme: "mint",
        readingMode: "rub",
        recitationId: 7,
        verseAudioOnClick: true,
        challengeSurah: 18,
        quranFontSize: "2.3rem",
        ...settings
      })
  });

  const sequenceQuery = useQuery({
    queryKey: ["verse-sequence"],
    queryFn: loadVerseSequence
  });

  const currentIndex = useMemo(() => sequenceQuery.data?.indexOf(verseKey) ?? -1, [sequenceQuery.data, verseKey]);
  const previousVerseKey = currentIndex > 0 ? sequenceQuery.data?.[currentIndex - 1] : "";
  const nextVerseKey = currentIndex >= 0 && currentIndex < (sequenceQuery.data?.length ?? 0) - 1 ? sequenceQuery.data?.[currentIndex + 1] : "";

  function scheduleEnhanceReset(delayMs: number) {
    if (enhanceResetTimerRef.current) {
      window.clearTimeout(enhanceResetTimerRef.current);
    }
    enhanceResetTimerRef.current = window.setTimeout(() => {
      setEnhanceState("idle");
      enhanceResetTimerRef.current = null;
    }, delayMs);
  }

  useEffect(() => {
    if (enhanceResetTimerRef.current) {
      window.clearTimeout(enhanceResetTimerRef.current);
      enhanceResetTimerRef.current = null;
    }
    setEnhancedSegments(null);
    setEnhanceState("idle");
    setEnhanceError("");
  }, [settings.tafsirId, verseKey]);

  useEffect(
    () => () => {
      if (enhanceResetTimerRef.current) {
        window.clearTimeout(enhanceResetTimerRef.current);
      }
    },
    []
  );

  const tafsirBlocks = useMemo(() => {
    if (enhancedSegments?.length) {
      return enhancedSegments.map((text) => ({
        type: "paragraph" as const,
        text
      }));
    }

    return buildTafsirBlocks(tafsirQuery.data?.tafsir.text ?? "", tafsirQuery.data?.tafsir.plain_text ?? "");
  }, [enhancedSegments, tafsirQuery.data?.tafsir.plain_text, tafsirQuery.data?.tafsir.text]);

  async function handleEnhance() {
    if (!tafsirQuery.data?.tafsir.plain_text) return;
    setEnhanceError("");
    setEnhanceState("loading");

    try {
      const payload = await enhanceTafsir(tafsirQuery.data.tafsir.text || tafsirQuery.data.tafsir.plain_text, {
        studyDuration: 30,
        breakDuration: 15,
        dailyGoalHours: 1,
        rubCount: 1,
        theme: "mint",
        readingMode: "rub",
        recitationId: 7,
        verseAudioOnClick: true,
        challengeSurah: 18,
        quranFontSize: "2.3rem",
        ...settings
      });
      setEnhancedSegments(payload.segments ?? []);
      setEnhanceState("done");
      scheduleEnhanceReset(1400);
    } catch (error) {
      setEnhanceError(error instanceof Error ? error.message : "تعذر تحسين التفسير.");
      setEnhanceState("error");
      scheduleEnhanceReset(1800);
    }
  }

  function renderBlock(text: string, index: number, kind: "heading" | "paragraph") {
    const Tag = kind === "heading" ? "h3" : "p";
    return (
      <Tag
        key={`${kind}-${index}-${text.slice(0, 12)}`}
        data-testid={`tafsir-block-${kind}-${index}`}
        className={cn(
          "text-ink",
          kind === "heading" ? "text-lg font-semibold leading-[2.1] sm:text-xl" : "leading-[2.2]"
        )}
      >
        {highlightTafsirText(text).map((part) => (
          <span
            key={part.id}
            className={
              part.type === "bracket"
                ? "tafsir-bracket font-bold"
                : part.type === "isnad"
                  ? "text-emerald-600 font-medium"
                  : undefined
            }
          >
            {parseSacredTexts(part.text).map((subPart) => (
              <span
                key={subPart.id}
                className={subPart.isSacred ? "font-bold text-rose-600" : undefined}
              >
                {subPart.text}
              </span>
            ))}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="col-span-1">
        <article className="glass-panel rounded-[2rem] px-6 py-6 sm:px-8">
          <div className="mb-6 space-y-8">
            {/* Verse Text taking full width */}
            <div className="pt-2">
              <h1 className="quran-text text-[clamp(1.8rem,2.6vw,2.8rem)] text-ink leading-relaxed">
                {(tafsirQuery.data?.verse_text ?? "جاري تحميل نص الآية...").trim()}
                <span className="mx-3 inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-accent/20 bg-accent/10 px-2 font-sans text-lg font-bold text-accent align-middle">
                  {formatVerseMarker(tafsirQuery.data?.verse_key ?? verseKey)}
                </span>
              </h1>
            </div>

            {/* Bottom Bar: Tools */}
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <select
                    value={settings.tafsirId}
                    onChange={(e) => patchSettings({ tafsirId: Number(e.target.value) })}
                    aria-label="اختر التفسير"
                    title="اختر التفسير"
                    className="appearance-none rounded-full border border-line bg-surface/80 pl-9 pr-4 py-3 text-sm font-semibold text-muted outline-none ring-0 focus:border-accent transition hover:border-accent/30 hover:text-accent"
                  >
                    {TAFSIR_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <ArrowDown className="h-4 w-4 text-muted" />
                  </div>
                </div>

                <Link
                  href={lastReaderRoute || "/reader/rub"}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:text-accent"
                >
                  <ArrowRight className="h-4 w-4" />
                  العودة للقراءة
                </Link>
              </div>
            </div>
          </div>

          <hr className="my-6 border-line/60" />

          {tafsirQuery.isLoading ? (
            <div className="text-sm leading-8 text-muted">جاري تحميل التفسير...</div>
          ) : tafsirQuery.error ? (
            <div className="space-y-3">
              <p className="text-sm leading-8 text-muted">
                {tafsirQuery.error instanceof Error ? tafsirQuery.error.message : "تعذر تحميل التفسير."}
              </p>
              {!statusQuery.data?.backendAvailable ? (
                <p className="text-sm leading-8 text-muted">التفسير يحتاج السيرفر المحلي الحالي، وهو غير متاح الآن.</p>
              ) : null}
            </div>
          ) : (
            <div data-testid="tafsir-content" className="tafsir-content space-y-6">
              {enhanceError ? <p className="text-sm leading-8 text-rose-700">{enhanceError}</p> : null}
              {tafsirBlocks.map((block, index) => renderBlock(block.text, index, block.type))}
            </div>
          )}
        </article>
      </section>

      {/* Floating Controls */}
      <div className="fixed bottom-8 left-4 z-40 flex flex-col gap-1.5 md:bottom-6 md:left-6">
        <div className="flex w-[48px] flex-col items-center gap-1.5 pt-7">
          <button
            type="button"
            data-testid="tafsir-prev-button"
            disabled={!previousVerseKey}
            onClick={() => previousVerseKey && router.replace(getTafsirPath(previousVerseKey))}
            aria-label="الآية السابقة"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/88 text-ink shadow-halo backdrop-blur-xl transition hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            data-testid="tafsir-next-button"
            disabled={!nextVerseKey}
            onClick={() => nextVerseKey && router.replace(getTafsirPath(nextVerseKey))}
            aria-label="الآية التالية"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/88 text-ink shadow-halo backdrop-blur-xl transition hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="fixed bottom-8 right-6 z-40 flex flex-col gap-1.5 md:bottom-6 md:right-8">
        <div className="flex w-[48px] flex-col items-center gap-1.5 pt-7">
          <button
            type="button"
            onClick={() => patchSettings({ tafsirFontSize: stepTafsirFontSize(settings.tafsirFontSize, 1) })}
            aria-label="تكبير الخط"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/88 text-ink shadow-halo backdrop-blur-xl transition hover:border-accent/30 hover:text-accent"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => patchSettings({ tafsirFontSize: stepTafsirFontSize(settings.tafsirFontSize, -1) })}
            aria-label="تصغير الخط"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/88 text-ink shadow-halo backdrop-blur-xl transition hover:border-accent/30 hover:text-accent"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .tafsir-content {
          font-size: ${settings.tafsirFontSize};
        }

        .tafsir-bracket {
          color: ${settings.tafsirHighlightColor};
        }
      `}</style>
    </div>
  );
}
