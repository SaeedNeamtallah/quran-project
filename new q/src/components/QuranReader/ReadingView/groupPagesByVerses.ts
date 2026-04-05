import type { QuranVerse } from "@/lib/types/quran";

export function groupPagesByVerses(verses: QuranVerse[]): Record<number, QuranVerse[]> {
  return verses.reduce<Record<number, QuranVerse[]>>((pages, verse) => {
    const versePages = new Set<number>();

    for (const word of verse.words ?? []) {
      const pageNumber = Number((word.v2_page ?? word.page_number ?? verse.page_number) || 0);
      if (pageNumber > 0) {
        versePages.add(pageNumber);
      }
    }

    if (!versePages.size) {
      const fallbackPageNumber = Number(verse.page_number || 0);
      if (fallbackPageNumber > 0) {
        versePages.add(fallbackPageNumber);
      }
    }

    for (const pageNumber of versePages) {
      if (!pages[pageNumber]) {
        pages[pageNumber] = [];
      }
      pages[pageNumber].push(verse);
    }

    return pages;
  }, {});
}
