import type { QuranVerse } from "@/lib/types/quran";
import { getSurahName } from "@/lib/utils/format";
import { parseChapterIdFromVerse, shouldRenderBasmala } from "@/lib/utils/verse";

export interface ReadingViewLineIntro {
  type: "surah-title" | "basmala" | "surah-title-basmala";
  chapterId: number;
  surahName: string;
  verseKey: string;
}

export interface ReadingViewWord {
  id: string;
  verseKey: string;
  position: number;
  pageNumber: number;
  lineNumber: number;
  v2Page: number;
  glyphV2: string;
  fallbackText: string;
  charTypeName: string;
  verse: QuranVerse;
}

export interface ReadingViewLine {
  lineKey: string;
  pageNumber: number;
  lineNumber: number;
  words: ReadingViewWord[];
  intro?: ReadingViewLineIntro;
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeReadingWord(verse: QuranVerse, word: NonNullable<QuranVerse["words"]>[number], index: number): ReadingViewWord | null {
  const verseKey = String(word.verse_key ?? verse.verse_key ?? "").trim();
  const sourcePageNumber = toFiniteNumber(word.page_number ?? verse.page_number);
  const v2Page = toFiniteNumber(word.v2_page ?? sourcePageNumber);
  const pageNumber = v2Page || sourcePageNumber;
  const lineNumber = toFiniteNumber(word.line_v2 ?? word.line_number);
  const glyphV2 = String(word.code_v2 ?? "").trim();
  const fallbackText = String(word.text_qpc_hafs ?? word.text_uthmani ?? word.text ?? "").trim();
  const charTypeName = String(word.char_type_name ?? "word").trim() || "word";
  const position = toFiniteNumber(word.position || index + 1);

  if (!verseKey || !lineNumber || !pageNumber || !(glyphV2 || fallbackText)) {
    return null;
  }

  return {
    id: `${verseKey}:${position}:${glyphV2 || fallbackText}`,
    verseKey,
    position,
    pageNumber,
    lineNumber,
    v2Page: v2Page || pageNumber,
    glyphV2,
    fallbackText,
    charTypeName,
    verse
  };
}

function getWordPageNumber(word: NonNullable<QuranVerse["words"]>[number], verse: QuranVerse) {
  const sourcePageNumber = toFiniteNumber(word.page_number ?? verse.page_number);
  const v2Page = toFiniteNumber(word.v2_page ?? sourcePageNumber);
  return v2Page || sourcePageNumber;
}

function getWordLineNumber(word: NonNullable<QuranVerse["words"]>[number]) {
  return toFiniteNumber(word.line_v2 ?? word.line_number);
}

function getFirstVerseLineNumberForPage(verse: QuranVerse, pageNumber: number) {
  const candidateLineNumbers = (verse.words ?? [])
    .filter((word) => getWordPageNumber(word, verse) === pageNumber)
    .map((word) => getWordLineNumber(word))
    .filter((lineNumber) => lineNumber > 0);

  if (!candidateLineNumbers.length) {
    return 0;
  }

  return Math.min(...candidateLineNumbers);
}

function buildIntroLinesForPage(verses: QuranVerse[], pageNumber: number, occupiedLineNumbers: Set<number>) {
  const introLines: ReadingViewLine[] = [];
  let previousChapterId = 0;

  verses.forEach((verse) => {
    const chapterId = parseChapterIdFromVerse(verse);
    const isSurahOpening = Boolean(chapterId) && Number(verse.verse_number) === 1 && chapterId !== previousChapterId;

    if (isSurahOpening && chapterId) {
      const firstVerseLineNumber = getFirstVerseLineNumberForPage(verse, pageNumber);
      const needsBasmala = shouldRenderBasmala(verse, previousChapterId);
      const introSlotCount = needsBasmala ? 2 : 1;
      const introStartLineNumber = firstVerseLineNumber - introSlotCount;
      const hasDedicatedIntroSlots =
        introStartLineNumber >= 1 &&
        Array.from({ length: introSlotCount }, (_, index) => introStartLineNumber + index).every(
          (lineNumber) => !occupiedLineNumbers.has(lineNumber)
        );

      if (hasDedicatedIntroSlots) {
        introLines.push({
          lineKey: `Page${pageNumber}-Line${introStartLineNumber}-SurahTitle-${chapterId}`,
          pageNumber,
          lineNumber: introStartLineNumber,
          words: [],
          intro: {
            type: "surah-title",
            chapterId,
            surahName: getSurahName(chapterId),
            verseKey: verse.verse_key
          }
        });
        occupiedLineNumbers.add(introStartLineNumber);

        if (needsBasmala) {
          const basmalaLineNumber = introStartLineNumber + 1;
          introLines.push({
            lineKey: `Page${pageNumber}-Line${basmalaLineNumber}-Basmala-${chapterId}`,
            pageNumber,
            lineNumber: basmalaLineNumber,
            words: [],
            intro: {
              type: "basmala",
              chapterId,
              surahName: getSurahName(chapterId),
              verseKey: verse.verse_key
            }
          });
          occupiedLineNumbers.add(basmalaLineNumber);
        }
      } else {
        const compactIntroLineNumber = firstVerseLineNumber - 1;
        if (compactIntroLineNumber >= 1 && !occupiedLineNumbers.has(compactIntroLineNumber)) {
          introLines.push({
            lineKey: `Page${pageNumber}-Line${compactIntroLineNumber}-SurahIntro-${chapterId}`,
            pageNumber,
            lineNumber: compactIntroLineNumber,
            words: [],
            intro: {
              type: needsBasmala ? "surah-title-basmala" : "surah-title",
              chapterId,
              surahName: getSurahName(chapterId),
              verseKey: verse.verse_key
            }
          });
          occupiedLineNumbers.add(compactIntroLineNumber);
        }
      }
    }

    if (chapterId) {
      previousChapterId = chapterId;
    }
  });

  return introLines;
}

export function groupLinesByVerses(verses: QuranVerse[]): Record<string, ReadingViewWord[]> {
  const lines: Record<string, ReadingViewWord[]> = {};

  verses.forEach((verse) => {
    (verse.words ?? []).forEach((word, index) => {
      const normalizedWord = normalizeReadingWord(verse, word, index);
      if (!normalizedWord) return;

      const lineKey = `Page${normalizedWord.pageNumber}-Line${normalizedWord.lineNumber}`;
      if (!lines[lineKey]) {
        lines[lineKey] = [];
      }
      lines[lineKey].push(normalizedWord);
    });
  });

  return lines;
}

export function buildReadingLinesForPage(verses: QuranVerse[], pageNumber: number): ReadingViewLine[] {
  const groupedLines = groupLinesByVerses(verses);
  const verseLines = Object.keys(groupedLines)
    .filter((lineKey) => lineKey.startsWith(`Page${pageNumber}-Line`))
    .sort((left, right) => {
      const leftNumber = Number(left.split("-Line")[1] ?? "0");
      const rightNumber = Number(right.split("-Line")[1] ?? "0");
      return leftNumber - rightNumber;
    })
    .map((lineKey) => ({
      lineKey,
      pageNumber,
      lineNumber: Number(lineKey.split("-Line")[1] ?? "0"),
      words: groupedLines[lineKey]
    }));

  const occupiedLineNumbers = new Set(verseLines.map((line) => line.lineNumber));
  const introLines = buildIntroLinesForPage(verses, pageNumber, occupiedLineNumbers);

  return [...introLines, ...verseLines].sort((left, right) => left.lineNumber - right.lineNumber);
}
