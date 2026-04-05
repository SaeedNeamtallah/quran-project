"use client";

import Page from "@/components/QuranReader/ReadingView/Page";
import { useQcfFont } from "@/lib/hooks/use-qcf-font";
import type { ReadingRendererMode } from "@/lib/types/app";
import type { QuranVerse } from "@/lib/types/quran";
import { hasQcfV2Layout } from "@/lib/utils/mushaf-layout";
import type { ReadingFontScale } from "@/lib/utils/font-face-helper";

export interface PageContainerProps {
  verses: QuranVerse[];
  displayPageNumber: number;
  fontPageNumber?: number;
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

export default function PageContainer({
  verses,
  displayPageNumber,
  fontPageNumber,
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
  ayahTestIdPrefix,
  lineTestIdBuilder
}: PageContainerProps) {
  const pageHasQcfLayout = hasQcfV2Layout(verses);
  const resolvedFontPageNumber = fontPageNumber ?? displayPageNumber;
  const { fontFamily, fontReady } = useQcfFont(resolvedFontPageNumber, pageHasQcfLayout);

  return (
    <Page
      verses={verses}
      displayPageNumber={displayPageNumber}
      groupingPageNumber={resolvedFontPageNumber}
      isFontLoaded={pageHasQcfLayout && fontReady}
      fontFamily={fontFamily}
      readingMode={readingMode}
      fontScale={fontScale}
      lineWidthScale={lineWidthScale}
      showPageNumber={showPageNumber}
      visibleVerseKeys={visibleVerseKeys}
      verseAudioEnabled={verseAudioEnabled}
      activeRecitationVerseKey={activeRecitationVerseKey}
      activeManualVerseKey={activeManualVerseKey}
      activeWordSignature={activeWordSignature}
      onPlayVerse={onPlayVerse}
      pageTestId={pageTestId}
      wordTestIdPrefix={wordTestIdPrefix}
      ayahTestIdPrefix={ayahTestIdPrefix}
      lineTestIdBuilder={lineTestIdBuilder}
    />
  );
}
