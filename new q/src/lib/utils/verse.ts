import type { Route } from "next";

import { getSurahName } from "@/lib/utils/format";
import type { ReaderRoute } from "@/lib/types/app";
import type { QuranVerse, ReadingMode } from "@/lib/types/quran";

const READER_ROUTES: ReaderRoute[] = ["/reader/rub", "/reader/page"];

export function parseChapterIdFromVerse(verse?: Partial<QuranVerse> | null) {
  const chapterId = Number(verse?.chapter_id ?? 0);
  if (chapterId > 0) return chapterId;

  const verseKey = String(verse?.verse_key ?? "");
  const parsed = Number.parseInt(verseKey.split(":", 1)[0] ?? "", 10);
  return Number.isInteger(parsed) ? parsed : 0;
}

export function shouldRenderBasmala(verse: QuranVerse, previousChapterId: number) {
  const chapterId = parseChapterIdFromVerse(verse);
  if (!chapterId || Number(verse.verse_number) !== 1) return false;
  if (chapterId === 1 || chapterId === 9) return false;
  return chapterId !== previousChapterId;
}

export function isReaderRoute(value: string): value is ReaderRoute {
  return READER_ROUTES.includes(value as ReaderRoute);
}

export function getVerseReaderPath(mode: ReadingMode): ReaderRoute {
  return mode === "page" ? "/reader/page" : "/reader/rub";
}

export function getTafsirPath(verseKey: string): Route {
  return `/tafsir/${encodeURIComponent(verseKey)}` as Route;
}

export function decodeVerseKeyParam(value: string) {
  return decodeURIComponent(value).trim();
}

export function formatRubSequenceLabel(rubNumber: string | number) {
  return `الربع ${rubNumber}`;
}

export function getReaderTitle(mode: ReadingMode, verses: QuranVerse[], metaOverride?: string) {
  if (metaOverride) return metaOverride;
  if (!verses.length) return "موضع القراءة";
  const chapter = parseChapterIdFromVerse(verses[0]);
  if (!chapter) return "موضع القراءة";

  const nextChapter = parseChapterIdFromVerse(verses[verses.length - 1]);
  if (chapter === nextChapter) return getSurahName(chapter);
  return `${getSurahName(chapter)} - ${getSurahName(nextChapter)}`;
}
