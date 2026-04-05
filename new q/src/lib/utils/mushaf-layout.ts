import type { QuranVerse, QuranWord } from "@/lib/types/quran";

export interface MushafLayoutWord {
  id: string;
  verseKey: string;
  position: number;
  lineNumber: number;
  pageNumber: number;
  glyph: string;
  text: string;
  charTypeName: string;
}

export interface MushafLayoutLine {
  lineNumber: number;
  words: MushafLayoutWord[];
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getQcfLineNumber(word: Partial<QuranWord> | null | undefined) {
  return toFiniteNumber(word?.line_v2 ?? word?.line_number);
}

export function getQcfPageNumber(verses: QuranVerse[], fallbackPage = 1) {
  for (const verse of verses) {
    for (const word of verse.words ?? []) {
      const pageNumber = toFiniteNumber(word.v2_page ?? word.page_number ?? verse.page_number);
      if (pageNumber > 0) return pageNumber;
    }
  }
  return fallbackPage;
}

export function getQcfFontFamily(pageNumber: number) {
  return `qcf-v2-page-${pageNumber}`;
}

export function getQcfFontUrl(pageNumber: number) {
  return `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p${pageNumber}.woff2`;
}

export function getDistinctQcfPageNumbers(verses: QuranVerse[]) {
  const pageNumbers: number[] = [];
  const seenPageNumbers = new Set<number>();

  for (const verse of verses) {
    for (const pageNumber of getQcfPageNumbersForVerse(verse)) {
      if (!pageNumber || seenPageNumbers.has(pageNumber)) continue;

      seenPageNumbers.add(pageNumber);
      pageNumbers.push(pageNumber);
    }
  }

  return pageNumbers;
}

export function getQcfPageNumbersForVerse(verse: QuranVerse) {
  const pageNumbers: number[] = [];
  const seenPageNumbers = new Set<number>();
  const fallbackPage = toFiniteNumber(verse.page_number) || 1;

  for (const word of verse.words ?? []) {
    const pageNumber = toFiniteNumber(word.v2_page ?? word.page_number ?? fallbackPage);
    if (!pageNumber || seenPageNumbers.has(pageNumber)) continue;
    seenPageNumbers.add(pageNumber);
    pageNumbers.push(pageNumber);
  }

  if (!pageNumbers.length && fallbackPage) {
    pageNumbers.push(fallbackPage);
  }

  return pageNumbers;
}

export function buildVisibleVerseKeysByPage(verses: QuranVerse[]) {
  const visibleVerseKeysByPage = new Map<number, Set<string>>();

  for (const verse of verses) {
    const verseKey = String(verse.verse_key ?? "").trim();
    if (!verseKey) continue;

    for (const pageNumber of getQcfPageNumbersForVerse(verse)) {
      if (!pageNumber) continue;
      const currentPageVerseKeys = visibleVerseKeysByPage.get(pageNumber) ?? new Set<string>();
      currentPageVerseKeys.add(verseKey);
      visibleVerseKeysByPage.set(pageNumber, currentPageVerseKeys);
    }
  }

  return visibleVerseKeysByPage;
}

export function hasQcfV2Layout(verses: QuranVerse[]) {
  return verses.some((verse) =>
    (verse.words ?? []).some((word) => {
      const glyph = String(word.code_v2 ?? "").trim();
      return Boolean(glyph) && getQcfLineNumber(word) > 0;
    })
  );
}

export function buildMushafLayoutLines(verses: QuranVerse[]) {
  const lines = new Map<number, MushafLayoutWord[]>();

  for (const verse of verses) {
    for (const word of verse.words ?? []) {
      const glyph = String(word.code_v2 ?? "").trim();
      const text = String(word.text_qpc_hafs ?? word.text_uthmani ?? word.text ?? glyph).trim();
      const lineNumber = getQcfLineNumber(word);
      const pageNumber = toFiniteNumber(word.v2_page ?? word.page_number);
      const position = toFiniteNumber(word.position);
      const verseKey = String(word.verse_key ?? "").trim();
      const charTypeName = String(word.char_type_name ?? "word").trim() || "word";

      if (!(glyph || text) || !lineNumber || !verseKey) continue;

      const current = lines.get(lineNumber) ?? [];

      current.push({
        id: `${verseKey}:${position}:${glyph}`,
        verseKey,
        position,
        lineNumber,
        pageNumber,
        glyph,
        text,
        charTypeName
      });

      lines.set(lineNumber, current);
    }
  }

  return [...lines.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([lineNumber, words]) => ({
      lineNumber,
      words
    })) satisfies MushafLayoutLine[];
}
