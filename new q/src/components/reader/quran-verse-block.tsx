"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Volume2 } from "lucide-react";

import type { QuranVerse } from "@/lib/types/quran";
import { cn } from "@/lib/utils/cn";
import { getTafsirPath, parseChapterIdFromVerse, shouldRenderBasmala } from "@/lib/utils/verse";

interface QuranVerseBlockProps {
  verses: QuranVerse[];
  quranFontSize: string;
  verseAudioEnabled: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  variant?: "cards" | "pages";
}

interface PageGroup {
  pageNumber: number;
  verses: QuranVerse[];
}

function groupVersesByPage(verses: QuranVerse[]) {
  const groups: PageGroup[] = [];

  for (const verse of verses) {
    const pageNumber = Number(verse.page_number ?? 0) || 0;
    const currentGroup = groups[groups.length - 1];

    if (!currentGroup || currentGroup.pageNumber !== pageNumber) {
      groups.push({
        pageNumber,
        verses: [verse]
      });
      continue;
    }

    currentGroup.verses.push(verse);
  }

  return groups;
}

function getQuranFontSizeClassName(quranFontSize: string) {
  switch (quranFontSize) {
    case "1.8rem":
      return "text-[1.8rem]";
    case "2rem":
      return "text-[2rem]";
    case "2.6rem":
      return "text-[2.6rem]";
    case "2.9rem":
      return "text-[2.9rem]";
    case "3.2rem":
      return "text-[3.2rem]";
    case "2.3rem":
    default:
      return "text-[2.3rem]";
  }
}

export function QuranVerseBlock({
  verses,
  quranFontSize,
  verseAudioEnabled,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  variant = "cards"
}: QuranVerseBlockProps) {
  if (variant === "pages") {
    const pageGroups = groupVersesByPage(verses);
    let previousChapterId = 0;

    return (
      <div className="space-y-5" dir="rtl">
        {pageGroups.map((group, groupIndex) => {
          const pageRangeTestId = `reader-page-sheet-${group.pageNumber || groupIndex + 1}`;
          const firstVerse = group.verses[0];

          return (
            <section
              key={`${group.pageNumber}-${groupIndex}`}
              data-testid={pageRangeTestId}
              className="rounded-[2rem] border border-line/70 bg-surface/72 px-5 py-6 shadow-halo backdrop-blur-sm sm:px-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3 text-xs text-muted">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-mist px-3 py-1">الصفحة {group.pageNumber}</span>
                  <span className="rounded-full bg-mist px-3 py-1">الجزء {firstVerse?.juz_number ?? "--"}</span>
                  <span className="rounded-full bg-mist px-3 py-1">الحزب {firstVerse?.hizb_number ?? "--"}</span>
                  <span className="rounded-full bg-mist px-3 py-1">الربع {firstVerse?.rub_el_hizb_number ?? "--"}</span>
                </div>
                <span className="text-[11px] leading-6 text-muted">عرض متصل داخل الصفحة بدل البطاقات المنفصلة.</span>
              </div>

              <div
                dir="rtl"
                className={cn("quran-text text-right leading-[2.35] text-ink", getQuranFontSizeClassName(quranFontSize))}
              >
                {group.verses.map((verse) => {
                  const showBasmala = shouldRenderBasmala(verse, previousChapterId);
                  previousChapterId = parseChapterIdFromVerse(verse);
                  const verseTestId = verse.verse_key.replace(/[^0-9A-Za-z]+/g, "-");
                  const verseWords = Array.isArray(verse.words)
                    ? verse.words
                      .filter((word) => String(word.char_type_name ?? "word") === "word")
                      .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0))
                    : [];
                  const isRecitationActive = activeRecitationVerseKey === verse.verse_key;
                  const isManualActive = activeManualVerseKey === verse.verse_key;

                  return (
                    <Fragment key={verse.verse_key}>
                      {showBasmala ? (
                        <div className="quran-text mb-5 mt-1 text-center text-[clamp(1.35rem,1.9vw,2.05rem)] text-accent">
                          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                        </div>
                      ) : null}

                      <span
                        data-testid={`verse-card-${verseTestId}`}
                        data-audio-state={isManualActive ? "manual" : isRecitationActive ? "recitation" : "idle"}
                        className={cn(
                          "inline align-baseline rounded-[1.1rem] px-1.5 py-1 [-webkit-box-decoration-break:clone] [box-decoration-break:clone]",
                          isRecitationActive && "bg-accent/7 text-[#0e5b4b]",
                          isManualActive && "bg-ink/6 text-ink"
                        )}
                      >
                        {verseWords.length ? (
                          verseWords.map((word) => {
                            const wordSignature = `${verse.verse_key}:${word.position}`;
                            return (
                              <span
                                key={`${verse.verse_key}-${word.position}`}
                                data-testid={`word-${verseTestId}-${word.position}`}
                                data-word-active={activeWordSignature === wordSignature ? "true" : "false"}
                                className={cn(
                                  "mx-[0.12em] inline-flex rounded-xl px-1.5 py-0.5 align-baseline",
                                  activeWordSignature === wordSignature &&
                                  "bg-[#daf4ea] text-[#0b7a65] shadow-[inset_0_0_0_1px_rgba(11,122,101,0.18)]"
                                )}
                                onClick={() => {
                                  if (!verseAudioEnabled || !onPlayVerse) return;
                                  onPlayVerse(verse.verse_key);
                                }}
                              >
                                {word.text_uthmani || word.text}
                              </span>
                            );
                          })
                        ) : (
                          <span
                            onClick={() => {
                              if (!verseAudioEnabled || !onPlayVerse) return;
                              onPlayVerse(verse.verse_key);
                            }}
                          >
                            {verse.text_uthmani}
                          </span>
                        )}

                        <span className="mx-1 inline-flex items-center gap-1.5 align-middle">
                          <button
                            type="button"
                            data-testid={`verse-audio-button-${verseTestId}`}
                            onClick={() => onPlayVerse?.(verse.verse_key)}
                            disabled={!verseAudioEnabled || !onPlayVerse}
                            className={cn(
                              "inline-flex h-8 w-8 items-center justify-center rounded-full border border-line/70 bg-surface/78 text-muted transition",
                              verseAudioEnabled ? "hover:border-accent/30 hover:text-accent" : "cursor-not-allowed opacity-50"
                            )}
                            aria-label={`تشغيل تلاوة الآية ${verse.verse_key}`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>

                          <Link
                            href={getTafsirPath(verse.verse_key)}
                            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-accent/10 px-2.5 text-sm font-semibold leading-none text-accent transition hover:bg-accent/15"
                          >
                            {verse.verse_number}
                          </Link>
                        </span>{" "}
                      </span>{" "}
                    </Fragment>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  let previousChapterId = 0;

  return (
    <div className="space-y-5" dir="rtl">
      {verses.map((verse) => {
        const showBasmala = shouldRenderBasmala(verse, previousChapterId);
        previousChapterId = parseChapterIdFromVerse(verse);
        const verseTestId = verse.verse_key.replace(/[^0-9A-Za-z]+/g, "-");

        const verseWords = Array.isArray(verse.words)
          ? verse.words
            .filter((word) => String(word.char_type_name ?? "word") === "word")
            .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0))
          : [];
        const isRecitationActive = activeRecitationVerseKey === verse.verse_key;
        const isManualActive = activeManualVerseKey === verse.verse_key;

        return (
          <div key={verse.verse_key} className="space-y-4">
            {showBasmala ? (
              <div className="quran-text text-center text-[clamp(1.5rem,2vw,2.3rem)] text-accent">
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </div>
            ) : null}

            <article
              data-testid={`verse-card-${verseTestId}`}
              data-audio-state={isManualActive ? "manual" : isRecitationActive ? "recitation" : "idle"}
              className={cn(
                "rounded-[1.75rem] border border-line/70 bg-surface/70 px-5 py-5 shadow-halo transition",
                isRecitationActive && "border-accent/40 bg-accent/5",
                isManualActive && "border-ink/25 bg-ink/5"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  dir="rtl"
                  className={cn("quran-text flex-1 text-right leading-[2.3]", getQuranFontSizeClassName(quranFontSize))}
                  onClick={() => {
                    if (!verseAudioEnabled || !onPlayVerse) return;
                    onPlayVerse(verse.verse_key);
                  }}
                >
                  {verseWords.length ? (
                    verseWords.map((word) => {
                      const wordSignature = `${verse.verse_key}:${word.position}`;
                      return (
                        <span
                          key={`${verse.verse_key}-${word.position}`}
                          data-testid={`word-${verseTestId}-${word.position}`}
                          data-word-active={activeWordSignature === wordSignature ? "true" : "false"}
                          className={cn(
                            "mx-[0.16em] inline-flex rounded-xl px-1.5 py-0.5",
                            activeWordSignature === wordSignature &&
                            "bg-[#daf4ea] text-[#0b7a65] shadow-[inset_0_0_0_1px_rgba(11,122,101,0.18)]"
                          )}
                        >
                          {word.text_uthmani || word.text}
                        </span>
                      );
                    })
                  ) : (
                    <span>{verse.text_uthmani}</span>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    data-testid={`verse-audio-button-${verseTestId}`}
                    onClick={() => onPlayVerse?.(verse.verse_key)}
                    disabled={!verseAudioEnabled || !onPlayVerse}
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/80 text-muted transition",
                      verseAudioEnabled ? "hover:border-accent/30 hover:text-accent" : "cursor-not-allowed opacity-50"
                    )}
                    aria-label={`تشغيل تلاوة الآية ${verse.verse_key}`}
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>

                  <Link
                    href={getTafsirPath(verse.verse_key)}
                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-accent/10 px-3 text-sm font-semibold text-accent transition hover:bg-accent/15"
                  >
                    {verse.verse_number}
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                <span className="rounded-full bg-mist px-3 py-1">الصفحة {verse.page_number}</span>
                <span className="rounded-full bg-mist px-3 py-1">الجزء {verse.juz_number}</span>
                <span className="rounded-full bg-mist px-3 py-1">الحزب {verse.hizb_number}</span>
                <span className="rounded-full bg-mist px-3 py-1">الربع {verse.rub_el_hizb_number}</span>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}
