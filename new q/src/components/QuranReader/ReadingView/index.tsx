"use client";

import { useMemo } from "react";

import styles from "./ReadingView.module.scss";

import PageContainer from "@/components/QuranReader/ReadingView/PageContainer";
import { buildReadingLinesForPage } from "@/components/QuranReader/ReadingView/groupLinesByVerses";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_MUSHAF_LINES,
  FALLBACK_FONT,
  getLineWidthClassName,
  resolveReadingPresentation
} from "@/lib/utils/font-face-helper";
import type { MushafLineWidthMode, MushafZoomMode } from "@/lib/types/app";
import type { QuranVerse } from "@/lib/types/quran";

export const READING_VIEW_PAGE_WIDTH_PX = 560;

export interface ReadingViewEntry {
  displayPageNumber: number;
  fontPageNumber: number;
  verses: QuranVerse[];
  visibleVerseKeys?: ReadonlySet<string>;
}

interface SpreadRow {
  key: string;
  rightPage?: ReadingViewEntry;
  leftPage?: ReadingViewEntry;
}

interface ReadingViewProps {
  entries: ReadingViewEntry[];
  pageScale: number;
  quranFontSize: string;
  mushafZoomMode: MushafZoomMode;
  mushafLineWidthMode: MushafLineWidthMode;
  spreadCount?: number;
  verseAudioEnabled: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  stageTestId: string;
  pageTestIdBuilder: (entry: ReadingViewEntry, index: number) => string;
  wordTestIdPrefix: string;
  ayahTestIdPrefix: string;
  lineTestIdBuilder: (entry: ReadingViewEntry, entryIndex: number, lineNumber: number) => string;
  showPageNumber?: boolean;
}

function isRightSidePage(pageNumber: number) {
  return pageNumber % 2 === 1;
}

function buildSpreadRows(entries: ReadingViewEntry[]) {
  const rows: SpreadRow[] = [];
  let pendingRightPage: ReadingViewEntry | undefined;

  for (const entry of entries) {
    if (isRightSidePage(entry.displayPageNumber)) {
      if (pendingRightPage) {
        rows.push({ key: `spread-${pendingRightPage.displayPageNumber}`, rightPage: pendingRightPage });
      }
      pendingRightPage = entry;
      continue;
    }

    if (pendingRightPage) {
      rows.push({
        key: `spread-${pendingRightPage.displayPageNumber}-${entry.displayPageNumber}`,
        rightPage: pendingRightPage,
        leftPage: entry
      });
      pendingRightPage = undefined;
      continue;
    }

    rows.push({ key: `spread-empty-${entry.displayPageNumber}`, leftPage: entry });
  }

  if (pendingRightPage) {
    rows.push({ key: `spread-${pendingRightPage.displayPageNumber}-empty`, rightPage: pendingRightPage });
  }

  return rows;
}

function renderPage({
  entry,
  entryIndex,
  showPageNumber,
  verseAudioEnabled,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  wordTestIdPrefix,
  ayahTestIdPrefix,
  readingRendererMode,
  readingFontScale,
  lineWidthScale,
  pageTestIdBuilder,
  lineTestIdBuilder
}: {
  entry?: ReadingViewEntry;
  entryIndex: number;
  showPageNumber: boolean;
  verseAudioEnabled: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  wordTestIdPrefix: string;
  ayahTestIdPrefix: string;
  readingRendererMode: ReturnType<typeof resolveReadingPresentation>["readingRendererMode"];
  readingFontScale: ReturnType<typeof resolveReadingPresentation>["fontScale"];
  lineWidthScale: ReturnType<typeof resolveReadingPresentation>["lineWidthScale"];
  pageTestIdBuilder: ReadingViewProps["pageTestIdBuilder"];
  lineTestIdBuilder: ReadingViewProps["lineTestIdBuilder"];
}) {
  if (!entry) {
    return <div aria-hidden="true" className="h-px w-full opacity-0" />;
  }

  return (
    <PageContainer
      verses={entry.verses}
      displayPageNumber={entry.displayPageNumber}
      fontPageNumber={entry.fontPageNumber}
      readingMode={readingRendererMode}
      fontScale={readingFontScale}
      lineWidthScale={lineWidthScale}
      showPageNumber={showPageNumber}
      visibleVerseKeys={entry.visibleVerseKeys}
      verseAudioEnabled={verseAudioEnabled}
      activeRecitationVerseKey={activeRecitationVerseKey}
      activeManualVerseKey={activeManualVerseKey}
      activeWordSignature={activeWordSignature}
      onPlayVerse={onPlayVerse}
      pageTestId={pageTestIdBuilder(entry, entryIndex)}
      wordTestIdPrefix={wordTestIdPrefix}
      ayahTestIdPrefix={ayahTestIdPrefix}
      lineTestIdBuilder={(lineNumber) => lineTestIdBuilder(entry, entryIndex, lineNumber)}
    />
  );
}

export default function ReadingView({
  entries,
  pageScale,
  quranFontSize,
  mushafZoomMode,
  mushafLineWidthMode,
  spreadCount = 1,
  verseAudioEnabled,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  stageTestId,
  pageTestIdBuilder,
  wordTestIdPrefix,
  ayahTestIdPrefix,
  lineTestIdBuilder,
  showPageNumber = false
}: ReadingViewProps) {
  const pageLinesReady = useMemo(
    () => entries.length > 0 && entries.every((entry) => buildReadingLinesForPage(entry.verses, entry.fontPageNumber).length > 0),
    [entries]
  );
  const spreadRows = useMemo(() => (spreadCount === 2 ? buildSpreadRows(entries) : []), [entries, spreadCount]);
  const readingPresentation = useMemo(
    () =>
      resolveReadingPresentation({
        pageScale,
        quranFontSize,
        mushafZoomMode,
        mushafLineWidthMode
      }),
    [mushafLineWidthMode, mushafZoomMode, pageScale, quranFontSize]
  );
  const readingPresentationStyle = useMemo(
    () => {
      const smoothGapExtra = mushafZoomMode === "smooth" ? Math.max(0, readingPresentation.fontSizeMultiplier - 1) : 0;
      const spreadGapRem = (2 + smoothGapExtra * 2.5).toFixed(3);
      const stackGapRem = (2 + smoothGapExtra * 1.75).toFixed(3);

      return {
        fontSizeMultiplier: String(readingPresentation.fontSizeMultiplier),
        lineHeightMultiplier: String(readingPresentation.lineHeightMultiplier),
        lineWidthMultiplier: String(readingPresentation.lineWidthMultiplier),
        spreadGap: `${spreadGapRem}rem`,
        stackGap: `${stackGapRem}rem`
      };
    },
    [
      mushafZoomMode,
      readingPresentation.fontSizeMultiplier,
      readingPresentation.lineHeightMultiplier,
      readingPresentation.lineWidthMultiplier
    ]
  );
  const spreadSlotClassName = getLineWidthClassName(
    FALLBACK_FONT,
    readingPresentation.lineWidthScale,
    DEFAULT_MUSHAF_LINES,
    true
  );

  return (
    <div data-testid={`${stageTestId}-viewport`} className={cn(styles.viewport, "reading-view-viewport") }>
      <div data-testid={stageTestId} className={styles.stage}>
        <div className={cn(styles.stack, spreadCount === 2 && styles.stackWithGap)}>
          {spreadCount === 2
            ? spreadRows.map((row, rowIndex) => (
                <div key={row.key}>
                  <div
                    dir="ltr"
                    data-testid={`reader-page-spread-${rowIndex + 1}`}
                    className={styles.spread}
                  >
                    <div
                      data-testid={`reader-page-slot-left-${rowIndex + 1}`}
                      data-slot-state={row.leftPage ? "filled" : "empty"}
                      className={cn(styles.slot, spreadSlotClassName)}
                    >
                      {renderPage({
                        entry: row.leftPage,
                        entryIndex: rowIndex * 2,
                        showPageNumber,
                        verseAudioEnabled,
                        activeRecitationVerseKey,
                        activeManualVerseKey,
                        activeWordSignature,
                        onPlayVerse,
                        wordTestIdPrefix,
                        ayahTestIdPrefix,
                        readingRendererMode: readingPresentation.readingRendererMode,
                        readingFontScale: readingPresentation.fontScale,
                        lineWidthScale: readingPresentation.lineWidthScale,
                        pageTestIdBuilder,
                        lineTestIdBuilder
                      })}
                    </div>
                    <div
                      data-testid={`reader-page-slot-right-${rowIndex + 1}`}
                      data-slot-state={row.rightPage ? "filled" : "empty"}
                      className={cn(styles.slot, spreadSlotClassName)}
                    >
                      {renderPage({
                        entry: row.rightPage,
                        entryIndex: rowIndex * 2 + 1,
                        showPageNumber,
                        verseAudioEnabled,
                        activeRecitationVerseKey,
                        activeManualVerseKey,
                        activeWordSignature,
                        onPlayVerse,
                        wordTestIdPrefix,
                        ayahTestIdPrefix,
                        readingRendererMode: readingPresentation.readingRendererMode,
                        readingFontScale: readingPresentation.fontScale,
                        lineWidthScale: readingPresentation.lineWidthScale,
                        pageTestIdBuilder,
                        lineTestIdBuilder
                      })}
                    </div>
                  </div>
                  {rowIndex < spreadRows.length - 1 && (
                    <div className="mx-auto mb-0 mt-10 w-4/5 border-b-2 border-line/40" />
                  )}
                </div>
              ))
            : entries.map((entry, index) => (
                <div key={entry.displayPageNumber} data-testid={`reader-page-spread-${index + 1}`}>
                  {renderPage({
                    entry,
                    entryIndex: index,
                    showPageNumber,
                    verseAudioEnabled,
                    activeRecitationVerseKey,
                    activeManualVerseKey,
                    activeWordSignature,
                    onPlayVerse,
                    wordTestIdPrefix,
                    ayahTestIdPrefix,
                    readingRendererMode: readingPresentation.readingRendererMode,
                    readingFontScale: readingPresentation.fontScale,
                    lineWidthScale: readingPresentation.lineWidthScale,
                    pageTestIdBuilder,
                    lineTestIdBuilder
                  })}
                  {index < entries.length - 1 && (
                    <div className="mx-auto mb-0 mt-10 w-4/5 border-b-2 border-line/40" />
                  )}
                </div>
              ))}
        </div>
      </div>

      <style jsx>{`
        .reading-view-viewport {
          --reader-font-size-multiplier: ${readingPresentationStyle.fontSizeMultiplier};
          --reader-line-height-multiplier: ${readingPresentationStyle.lineHeightMultiplier};
          --reader-line-width-multiplier: ${readingPresentationStyle.lineWidthMultiplier};
          --reader-spread-gap: ${readingPresentationStyle.spreadGap};
          --reader-stack-gap: ${readingPresentationStyle.stackGap};
        }
      `}</style>
    </div>
  );
}
