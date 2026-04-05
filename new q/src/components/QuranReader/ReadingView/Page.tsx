"use client";

import { useMemo } from "react";

import styles from "./Page.module.scss";

import { buildReadingLinesForPage } from "@/components/QuranReader/ReadingView/groupLinesByVerses";
import Line from "@/components/QuranReader/ReadingView/Line";
import PageFooter from "@/components/QuranReader/ReadingView/PageFooter";
import type { ReadingRendererMode } from "@/lib/types/app";
import type { QuranVerse } from "@/lib/types/quran";
import {
  getFontClassName,
  getLineWidthClassName,
  type ReadingFontScale
} from "@/lib/utils/font-face-helper";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_MUSHAF_LINES, DEFAULT_QURAN_FONT, FALLBACK_FONT } from "@/lib/utils/font-face-helper";

interface ReadingPageProps {
  verses: QuranVerse[];
  displayPageNumber: number;
  groupingPageNumber: number;
  isFontLoaded: boolean;
  fontFamily: string;
  readingMode: ReadingRendererMode;
  fontScale: ReadingFontScale;
  lineWidthScale?: ReadingFontScale;
  showPageNumber?: boolean;
  visibleVerseKeys?: ReadonlySet<string>;
  verseAudioEnabled: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  pageTestId: string;
  wordTestIdPrefix: string;
  ayahTestIdPrefix?: string;
  lineTestIdBuilder?: (lineNumber: number) => string;
}

export default function Page({
  verses,
  displayPageNumber,
  groupingPageNumber,
  isFontLoaded,
  fontFamily,
  readingMode,
  fontScale,
  lineWidthScale = fontScale,
  showPageNumber = false,
  visibleVerseKeys,
  verseAudioEnabled,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  pageTestId,
  wordTestIdPrefix,
  ayahTestIdPrefix = "mushaf-ayah",
  lineTestIdBuilder
}: ReadingPageProps) {
  const lines = useMemo(() => buildReadingLinesForPage(verses, groupingPageNumber), [groupingPageNumber, verses]);
  const isBigTextLayout = readingMode === "bigText";
  const fontClassName = isFontLoaded
    ? getFontClassName(DEFAULT_QURAN_FONT, fontScale, DEFAULT_MUSHAF_LINES)
    : getFontClassName(FALLBACK_FONT, fontScale, DEFAULT_MUSHAF_LINES, true);
  const lineWidthClassName = getLineWidthClassName(
    isFontLoaded ? DEFAULT_QURAN_FONT : FALLBACK_FONT,
    lineWidthScale,
    DEFAULT_MUSHAF_LINES,
    !isFontLoaded
  );

  return (
    <div
      id={`page-${displayPageNumber}`}
      data-testid={pageTestId}
      data-render-mode={isFontLoaded ? "glyph" : "fallback-text"}
      data-reading-mode={readingMode}
      className={cn(
        styles.container,
        "qcf-page-font-scope",
        isBigTextLayout && styles.mobileCenterText,
        fontClassName,
        lineWidthClassName
      )}
      dir="rtl"
    >
      <div className="sr-only">
        {verses.map((verse) => {
          const verseTestId = verse.verse_key.replace(/[^0-9A-Za-z]+/g, "-");
          const isRecitationActive = activeRecitationVerseKey === verse.verse_key;
          const isManualActive = activeManualVerseKey === verse.verse_key;

          return (
            <span
              key={verse.verse_key}
              data-testid={`verse-card-${verseTestId}`}
              data-audio-state={isManualActive ? "manual" : isRecitationActive ? "recitation" : "idle"}
            />
          );
        })}
      </div>
      <div className={cn(styles.linesContainer, styles.mushafRows)}>
        {lines.map((line) => (
          <Line
            key={line.lineKey}
            line={line}
            lineRowNumber={line.lineNumber}
            isFontLoaded={isFontLoaded}
            fontFamily={fontFamily}
            readingMode={readingMode}
            fontScale={fontScale}
            visibleVerseKeys={visibleVerseKeys}
            verseAudioEnabled={verseAudioEnabled}
            activeRecitationVerseKey={activeRecitationVerseKey}
            activeManualVerseKey={activeManualVerseKey}
            activeWordSignature={activeWordSignature}
            onPlayVerse={onPlayVerse}
            wordTestIdPrefix={wordTestIdPrefix}
            ayahTestIdPrefix={ayahTestIdPrefix}
            lineTestId={lineTestIdBuilder?.(line.lineNumber)}
          />
        ))}
      </div>
      {showPageNumber ? <PageFooter pageNumber={displayPageNumber} /> : null}

      <style jsx>{`
        .qcf-page-font-scope {
          --qcf-page-font-family: "${fontFamily}";
        }
      `}</style>
    </div>
  );
}
