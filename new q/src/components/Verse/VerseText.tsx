"use client";

import { useState } from "react";

import styles from "./VerseText.module.scss";

import QuranWord from "@/components/Verse/QuranWord";
import type { ReadingViewWord } from "@/components/QuranReader/ReadingView/groupLinesByVerses";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_MUSHAF_LINES,
  DEFAULT_QURAN_FONT,
  FALLBACK_FONT,
  getFontClassName,
  type ReadingFontScale
} from "@/lib/utils/font-face-helper";

interface VerseTextProps {
  words: ReadingViewWord[];
  isReadingMode?: boolean;
  isHighlighted?: boolean;
  quranTextFontScale: ReadingFontScale;
  isFontLoaded?: boolean;
  fontFamily?: string;
  visibleVerseKeys?: ReadonlySet<string>;
  verseAudioEnabled?: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  wordTestIdPrefix: string;
  ayahTestIdPrefix: string;
  shouldShowH1ForSEO?: boolean;
}

export default function VerseText({
  words,
  isReadingMode = false,
  isHighlighted = false,
  quranTextFontScale,
  isFontLoaded = true,
  fontFamily,
  visibleVerseKeys,
  verseAudioEnabled = false,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  wordTestIdPrefix,
  ayahTestIdPrefix,
  shouldShowH1ForSEO = false
}: VerseTextProps) {
  const [hoveredVerseKey, setHoveredVerseKey] = useState("");
  const [hoveredWordSignature, setHoveredWordSignature] = useState("");
  const firstWord = words[0];
  if (!firstWord) {
    return null;
  }
  const isBigTextLayout = isReadingMode && quranTextFontScale > 3;
  const fontClassName = isFontLoaded
    ? getFontClassName(DEFAULT_QURAN_FONT, quranTextFontScale, DEFAULT_MUSHAF_LINES)
    : getFontClassName(FALLBACK_FONT, quranTextFontScale, DEFAULT_MUSHAF_LINES, true);
  const VerseTextContainer = (shouldShowH1ForSEO ? "h1" : "div") as keyof React.JSX.IntrinsicElements;
  const clearHoverState = () => {
    setHoveredVerseKey("");
    setHoveredWordSignature("");
  };

  return (
    <VerseTextContainer
      data-testid={`verse-arabic-${firstWord.verseKey}`}
      className={cn(styles.verseTextContainer, fontClassName, {
        [styles.largeQuranTextLayoutContainer]: isBigTextLayout,
        [styles.highlighted]: isHighlighted,
        [styles.readingModeContainer]: isReadingMode,
        [styles.tafsirOrTranslationMode]: !isReadingMode
      })}
      onMouseLeave={clearHoverState}
      onBlur={(event) => {
        const nextFocusedElement = event.relatedTarget;
        if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
          clearHoverState();
        }
      }}
    >
      <div
        translate="no"
        className={cn(styles.verseText, {
          [styles.verseTextWrap]: !isReadingMode,
          [styles.largeQuranTextLayout]: isBigTextLayout
        })}
      >
        {words.map((word) => (
          <QuranWord
            key={word.id}
            word={word}
            font={DEFAULT_QURAN_FONT}
            isFontLoaded={isFontLoaded}
            fontFamily={fontFamily}
            isVisible={!visibleVerseKeys || visibleVerseKeys.has(word.verseKey) || word.charTypeName === "end"}
            verseAudioEnabled={verseAudioEnabled}
            activeRecitationVerseKey={activeRecitationVerseKey}
            activeManualVerseKey={activeManualVerseKey}
            activeWordSignature={activeWordSignature}
            onPlayVerse={onPlayVerse}
            wordTestIdPrefix={wordTestIdPrefix}
            ayahTestIdPrefix={ayahTestIdPrefix}
            isVerseHovered={hoveredVerseKey === word.verseKey}
            isWordHovered={hoveredWordSignature === `${word.verseKey}:${word.position}`}
            onHover={() => {
              setHoveredVerseKey(word.verseKey);
              setHoveredWordSignature(`${word.verseKey}:${word.position}`);
            }}
          />
        ))}
      </div>
    </VerseTextContainer>
  );
}
