import { describe, expect, it } from "vitest";

import { buildReadingLinesForPage, groupLinesByVerses } from "@/components/QuranReader/ReadingView/groupLinesByVerses";
import type { QuranVerse } from "@/lib/types/quran";

const verses: QuranVerse[] = [
  {
    id: 1,
    verse_number: 1,
    verse_key: "1:1",
    hizb_number: 1,
    rub_el_hizb_number: 1,
    ruku_number: 1,
    manzil_number: 1,
    text_uthmani: "بسم الله",
    page_number: 1,
    juz_number: 1,
    chapter_id: 1,
    words: [
      {
        position: 1,
        verse_key: "1:1",
        char_type_name: "word",
        text_qpc_hafs: "بِسۡمِ",
        code_v2: "ﱁ",
        page_number: 1,
        line_number: 3,
        v2_page: 604,
        line_v2: 8
      },
      {
        position: 2,
        verse_key: "1:1",
        char_type_name: "end",
        text_qpc_hafs: "١",
        code_v2: "ﱂ",
        page_number: 1,
        line_number: 3,
        v2_page: 604,
        line_v2: 8
      }
    ]
  },
  {
    id: 2,
    verse_number: 2,
    verse_key: "1:2",
    hizb_number: 1,
    rub_el_hizb_number: 1,
    ruku_number: 1,
    manzil_number: 1,
    text_uthmani: "الحمد لله",
    page_number: 1,
    juz_number: 1,
    chapter_id: 1,
    words: [
      {
        position: 1,
        verse_key: "1:2",
        char_type_name: "word",
        text_qpc_hafs: "ٱلۡحَمۡدُ",
        code_v2: "ﱃ",
        page_number: 1,
        line_number: 4,
        v2_page: 604,
        line_v2: 9
      }
    ]
  }
];

describe("groupLinesByVerses", () => {
  it("groups words by v2 page and line instead of verse or legacy page fields", () => {
    const grouped = groupLinesByVerses(verses);

    expect(Object.keys(grouped)).toEqual(["Page604-Line8", "Page604-Line9"]);
    expect(grouped["Page604-Line8"]).toHaveLength(2);
    expect(grouped["Page604-Line9"]).toHaveLength(1);
  });

  it("builds sorted reading lines for the requested page", () => {
    const lines = buildReadingLinesForPage(verses, 604);

    expect(lines.map((line) => line.lineNumber)).toEqual([7, 8, 9]);
    expect(lines[0]?.intro?.type).toBe("surah-title");
    expect(lines[1]?.words.map((word) => word.verseKey)).toEqual(["1:1", "1:1"]);
    expect(lines[2]?.words.map((word) => word.verseKey)).toEqual(["1:2"]);
  });

  it("inserts surah title and basmala lines before a new surah when the page has room", () => {
    const surahOpeningVerses: QuranVerse[] = [
      {
        id: 10,
        verse_number: 1,
        verse_key: "2:1",
        hizb_number: 1,
        rub_el_hizb_number: 1,
        ruku_number: 1,
        manzil_number: 1,
        text_uthmani: "الم",
        page_number: 2,
        juz_number: 1,
        chapter_id: 2,
        words: [
          {
            position: 1,
            verse_key: "2:1",
            char_type_name: "word",
            text_qpc_hafs: "الٓمٓ",
            code_v2: "ﲀ",
            page_number: 2,
            line_number: 3,
            v2_page: 2,
            line_v2: 3
          },
          {
            position: 2,
            verse_key: "2:1",
            char_type_name: "end",
            text_qpc_hafs: "١",
            code_v2: "ﲁ",
            page_number: 2,
            line_number: 3,
            v2_page: 2,
            line_v2: 3
          }
        ]
      },
      {
        id: 11,
        verse_number: 2,
        verse_key: "2:2",
        hizb_number: 1,
        rub_el_hizb_number: 1,
        ruku_number: 1,
        manzil_number: 1,
        text_uthmani: "ذَٰلِكَ الْكِتَابُ",
        page_number: 2,
        juz_number: 1,
        chapter_id: 2,
        words: [
          {
            position: 1,
            verse_key: "2:2",
            char_type_name: "word",
            text_qpc_hafs: "ذَٰلِكَ",
            code_v2: "ﲂ",
            page_number: 2,
            line_number: 4,
            v2_page: 2,
            line_v2: 4
          }
        ]
      }
    ];

    const lines = buildReadingLinesForPage(surahOpeningVerses, 2);

    expect(lines.map((line) => line.lineNumber)).toEqual([1, 2, 3, 4]);
    expect(lines[0]?.intro).toMatchObject({
      type: "surah-title",
      chapterId: 2,
      surahName: "البقرة",
      verseKey: "2:1"
    });
    expect(lines[1]?.intro).toMatchObject({
      type: "basmala",
      chapterId: 2,
      surahName: "البقرة",
      verseKey: "2:1"
    });
    expect(lines[2]?.words.map((word) => word.verseKey)).toEqual(["2:1", "2:1"]);
    expect(lines[3]?.words.map((word) => word.verseKey)).toEqual(["2:2"]);
  });
});
