"use client";

import styles from "./Line.module.scss";

import VerseText from "@/components/Verse/VerseText";
import type { ReadingViewLine } from "@/components/QuranReader/ReadingView/groupLinesByVerses";
import type { ReadingRendererMode } from "@/lib/types/app";
import type { ReadingFontScale } from "@/lib/utils/font-face-helper";
import { cn } from "@/lib/utils/cn";

interface ReadingLineProps {
  line: ReadingViewLine;
  lineRowNumber?: number;
  isFontLoaded: boolean;
  fontFamily: string;
  readingMode: ReadingRendererMode;
  fontScale: ReadingFontScale;
  visibleVerseKeys?: ReadonlySet<string>;
  verseAudioEnabled: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  wordTestIdPrefix: string;
  ayahTestIdPrefix: string;
  lineTestId?: string;
}

export default function Line({
  line,
  lineRowNumber,
  isFontLoaded,
  fontFamily,
  readingMode,
  fontScale,
  visibleVerseKeys,
  verseAudioEnabled,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  wordTestIdPrefix,
  ayahTestIdPrefix,
  lineTestId
}: ReadingLineProps) {
  const isBigTextLayout = readingMode === "bigText";
  const shouldShowIntro = Boolean(line.intro && (!visibleVerseKeys || visibleVerseKeys.has(line.intro.verseKey)));

  if (!line.words.length && !shouldShowIntro) {
    return null;
  }

  function renderLineIntro() {
    if (!shouldShowIntro || !line.intro) {
      return null;
    }

    const chapterLabel = `سورة ${line.intro.surahName}`;

    return (
      <div
        data-testid={`surah-intro-${line.pageNumber}-${line.lineNumber}`}
        className={cn(styles.surahIntro, line.intro.type === "basmala" && styles.basmalaOnly)}
      >
        {line.intro.type !== "basmala" ? <div className={styles.surahTitle}>{chapterLabel}</div> : null}
        {line.intro.type !== "surah-title" ? (
          <div className={cn("quran-text", styles.basmalaText)}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      id={line.lineKey}
      data-testid={lineTestId}
      data-line-grouping="line-number"
      data-page={line.pageNumber}
      data-line-number={line.lineNumber}
      data-line-row={lineRowNumber}
      className={styles.container}
      dir="rtl"
    >
      <div
        className={cn(styles.line, {
          [styles.mobileInline]: isBigTextLayout,
          [styles.fixedWidth]: !isBigTextLayout
        })}
      >
        {renderLineIntro()}
        <VerseText
          words={line.words}
          isReadingMode
          quranTextFontScale={fontScale}
          isFontLoaded={isFontLoaded}
          fontFamily={fontFamily}
          visibleVerseKeys={visibleVerseKeys}
          verseAudioEnabled={verseAudioEnabled}
          activeRecitationVerseKey={activeRecitationVerseKey}
          activeManualVerseKey={activeManualVerseKey}
          activeWordSignature={activeWordSignature}
          onPlayVerse={onPlayVerse}
          wordTestIdPrefix={wordTestIdPrefix}
          ayahTestIdPrefix={ayahTestIdPrefix}
        />
      </div>
    </div>
  );
}
