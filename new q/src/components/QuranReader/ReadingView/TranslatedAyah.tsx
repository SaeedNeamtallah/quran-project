"use client";

import { Fragment } from "react";
import Link from "next/link";

import styles from "./TranslatedAyah.module.scss";

import type { ReadingViewWord } from "@/components/QuranReader/ReadingView/groupLinesByVerses";
import { cn } from "@/lib/utils/cn";
import { getTafsirPath } from "@/lib/utils/verse";

interface TranslatedAyahProps {
  words: ReadingViewWord[];
  renderMode: "glyph" | "fallback-text";
  fontFamily: string;
  visibleVerseKeys?: ReadonlySet<string>;
  verseAudioEnabled: boolean;
  activeRecitationVerseKey?: string;
  activeManualVerseKey?: string;
  activeWordSignature?: string;
  onPlayVerse?: (verseKey: string) => void;
  wordTestIdPrefix: string;
  ayahTestIdPrefix: string;
}

function toVerseTestSlug(value: string) {
  return String(value || "").replace(/[^0-9A-Za-z]+/g, "-");
}

function renderQcfGlyph(glyph: string) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline align-baseline", styles.glyphText)}
      dangerouslySetInnerHTML={{ __html: glyph }}
    />
  );
}

function renderUnicodeText(text: string) {
  return (
    <span aria-hidden="true" className={cn("inline align-baseline", styles.fallbackText)}>
      {text}
    </span>
  );
}

export default function TranslatedAyah({
  words,
  renderMode,
  visibleVerseKeys,
  verseAudioEnabled,
  activeRecitationVerseKey,
  activeManualVerseKey,
  activeWordSignature,
  onPlayVerse,
  wordTestIdPrefix,
  ayahTestIdPrefix
}: TranslatedAyahProps) {
  return (
    <>
      {words.map((word, index) => {
        const verseSlug = toVerseTestSlug(word.verseKey);
        const wordSignature = `${word.verseKey}:${word.position}`;
        const wordIsVisible = !visibleVerseKeys || visibleVerseKeys.has(word.verseKey) || word.charTypeName === "end";
        const verseIsActive = activeRecitationVerseKey === word.verseKey || activeManualVerseKey === word.verseKey;
        const wordIsActive = activeWordSignature === wordSignature;
        const renderedContent =
          renderMode === "glyph" && word.glyphV2 ? renderQcfGlyph(word.glyphV2) : renderUnicodeText(word.fallbackText);

        if (word.charTypeName === "end") {
          return (
            <Fragment key={word.id}>
              <Link
                href={getTafsirPath(word.verseKey)}
                aria-label={`افتح تفسير الآية ${word.verseKey}`}
                title={word.fallbackText}
                data-testid={`${ayahTestIdPrefix}-${verseSlug}`}
                data-verse-active={verseIsActive ? "true" : "false"}
                className={cn(styles.endMarkerLink, verseIsActive && styles.verseActive)}
              >
                {renderUnicodeText(word.fallbackText)}
              </Link>
              {index < words.length - 1 ? " " : null}
            </Fragment>
          );
        }

        if (!wordIsVisible) {
          return (
            <Fragment key={word.id}>
              <span aria-hidden="true" data-testid={`${wordTestIdPrefix}-${verseSlug}-${word.position}`} className="invisible inline align-baseline leading-none">
                {renderedContent}
              </span>
              {index < words.length - 1 ? " " : null}
            </Fragment>
          );
        }

        return (
          <Fragment key={word.id}>
            <button
              type="button"
              onClick={() => onPlayVerse?.(word.verseKey)}
              aria-label={`تشغيل الآية ${word.verseKey}`}
              title={word.fallbackText}
              data-testid={`${wordTestIdPrefix}-${verseSlug}-${word.position}`}
              data-word-active={wordIsActive ? "true" : "false"}
              data-verse-active={verseIsActive ? "true" : "false"}
              disabled={!verseAudioEnabled || !onPlayVerse}
              className={cn(
                styles.interactiveWord,
                verseAudioEnabled && onPlayVerse ? styles.interactiveWordEnabled : styles.interactiveWordDisabled,
                wordIsActive ? styles.wordActive : verseIsActive ? styles.verseActive : ""
              )}
            >
              {renderedContent}
            </button>
            {index < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </>
  );
}
