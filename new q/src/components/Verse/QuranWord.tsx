"use client";

import Link from "next/link";

import styles from "./QuranWord.module.scss";

import type { ReadingViewWord } from "@/components/QuranReader/ReadingView/groupLinesByVerses";
import type { QuranFont as QuranFontType } from "@/lib/types/quran-reader";
import { QuranFont } from "@/lib/types/quran-reader";
import { cn } from "@/lib/utils/cn";
import { getTafsirPath } from "@/lib/utils/verse";

interface QuranWordProps {
  word: ReadingViewWord;
  font: QuranFontType;
  isFontLoaded: boolean;
  fontFamily?: string;
  isHighlighted?: boolean;
  isStartingVerseHighlighted?: boolean;
  isVisible?: boolean;
  verseAudioEnabled?: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  wordTestIdPrefix: string;
  ayahTestIdPrefix: string;
  isVerseHovered?: boolean;
  isWordHovered?: boolean;
  onHover?: () => void;
}

function toVerseTestSlug(value: string) {
  return String(value || "").replace(/[^0-9A-Za-z]+/g, "-");
}

function renderGlyph(glyph: string) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline align-baseline", styles.wordContent, styles.glyphText)}
      dangerouslySetInnerHTML={{ __html: glyph }}
    />
  );
}

function renderFallbackText(text: string) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline align-baseline", styles.wordContent, styles.fallbackText)}
    >
      {text}
    </span>
  );
}

export default function QuranWord({
  word,
  font,
  isFontLoaded,
  isHighlighted = false,
  isStartingVerseHighlighted = false,
  isVisible = true,
  verseAudioEnabled = false,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  wordTestIdPrefix,
  ayahTestIdPrefix,
  isVerseHovered = false,
  isWordHovered = false,
  onHover
}: QuranWordProps) {
  const verseSlug = toVerseTestSlug(word.verseKey);
  const wordSignature = `${word.verseKey}:${word.position}`;
  const isWordActive = activeWordSignature === wordSignature;
  const verseState =
    activeRecitationVerseKey === word.verseKey ? "recitation" : activeManualVerseKey === word.verseKey ? "manual" : "idle";
  const isVerseActive = verseState !== "idle";
  const shouldRenderGlyph = font === QuranFont.MadaniV2 && isFontLoaded && Boolean(word.glyphV2) && word.charTypeName !== "end";
  const content = shouldRenderGlyph ? renderGlyph(word.glyphV2) : renderFallbackText(word.fallbackText);
  const commonClassName = cn(
    styles.container,
    isHighlighted && styles.highlighted,
    isWordActive && styles.activeWord,
    verseState === "recitation" && styles.recitationVerse,
    verseState === "manual" && styles.manualVerse,
    isStartingVerseHighlighted && styles.startingVerseHighlighted,
    isVerseHovered && styles.verseHovered,
    isWordHovered && styles.wordHovered,
    !isVisible && styles.hiddenWord
  );

  const hoverProps = {
    onMouseEnter: onHover,
    onFocus: onHover
  };

  if (word.charTypeName === "end") {
    return isVisible ? (
      <Link
        href={getTafsirPath(word.verseKey)}
        aria-label={`افتح تفسير الآية ${word.verseKey}`}
        title={word.fallbackText}
        data-testid={`${ayahTestIdPrefix}-${verseSlug}`}
        data-verse-active={isVerseActive ? "true" : "false"}
        data-verse-state={verseState}
        className={cn(commonClassName, styles.verseMarker)}
        {...hoverProps}
      >
        {renderFallbackText(word.fallbackText)}
      </Link>
    ) : (
      <span aria-hidden="true" className={cn(commonClassName, styles.verseMarker)}>
        {renderFallbackText(word.fallbackText)}
      </span>
    );
  }

  if (!isVisible) {
    return (
      <span
        aria-hidden="true"
        data-testid={`${wordTestIdPrefix}-${verseSlug}-${word.position}`}
        data-word-active={isWordActive ? "true" : "false"}
        data-verse-active={isVerseActive ? "true" : "false"}
        data-verse-state={verseState}
        className={cn(commonClassName, styles.static)}
        title={word.fallbackText}
        {...hoverProps}
      >
        {content}
      </span>
    );
  }

  if (!verseAudioEnabled || !onPlayVerse) {
    return (
      <span
        data-testid={`${wordTestIdPrefix}-${verseSlug}-${word.position}`}
        data-word-active={isWordActive ? "true" : "false"}
        data-verse-active={isVerseActive ? "true" : "false"}
        data-verse-state={verseState}
        className={cn(commonClassName, styles.static)}
        title={word.fallbackText}
        {...hoverProps}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPlayVerse(word.verseKey)}
      aria-label={`تشغيل الآية ${word.verseKey}`}
      title={word.fallbackText}
      data-testid={`${wordTestIdPrefix}-${verseSlug}-${word.position}`}
      data-word-active={isWordActive ? "true" : "false"}
      data-verse-active={isVerseActive ? "true" : "false"}
      data-verse-state={verseState}
      className={cn(commonClassName, styles.interactive)}
      {...hoverProps}
    >
      {content}
    </button>
  );
}
