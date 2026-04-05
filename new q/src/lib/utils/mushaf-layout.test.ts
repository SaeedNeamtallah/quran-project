import { describe, expect, it } from "vitest";

import {
  buildMushafLayoutLines,
  buildVisibleVerseKeysByPage,
  getDistinctQcfPageNumbers,
  getQcfPageNumbersForVerse,
  hasQcfV2Layout
} from "@/lib/utils/mushaf-layout";

const spanningVerse = {
  id: 1,
  verse_number: 1,
  verse_key: "2:5",
  hizb_number: 1,
  rub_el_hizb_number: 1,
  ruku_number: 1,
  manzil_number: 1,
  text_uthmani: "ذلك",
  page_number: 2,
  juz_number: 1,
  words: [
    {
      position: 1,
      verse_key: "2:5",
      char_type_name: "word",
      text_qpc_hafs: "ذَٰلِكَ",
      code_v2: "ﲀ",
      page_number: 2,
      line_number: 3,
      v2_page: 2,
      line_v2: 3
    },
    {
      position: 2,
      verse_key: "2:5",
      char_type_name: "word",
      text_qpc_hafs: "ٱلۡكِتَٰبُ",
      code_v2: "ﲁ",
      page_number: 3,
      line_number: 1,
      v2_page: 3,
      line_v2: 1
    }
  ]
};

describe("mushaf layout", () => {
  it("maps a single verse to every QCF page it spans", () => {
    expect(getQcfPageNumbersForVerse(spanningVerse)).toEqual([2, 3]);
  });

  it("builds page visibility from full spanning verse coverage", () => {
    const visibleVerseKeysByPage = buildVisibleVerseKeysByPage([spanningVerse]);
    expect([...visibleVerseKeysByPage.get(2)!]).toEqual(["2:5"]);
    expect([...visibleVerseKeysByPage.get(3)!]).toEqual(["2:5"]);
  });

  it("derives distinct page numbers across all spanning verses", () => {
    expect(
      getDistinctQcfPageNumbers([
        spanningVerse,
        {
          ...spanningVerse,
          id: 2,
          verse_key: "2:6",
          words: [
            {
              position: 1,
              verse_key: "2:6",
              char_type_name: "word",
              text_qpc_hafs: "هُدٗى",
              code_v2: "ﲂ",
              page_number: 3,
              line_number: 2,
              v2_page: 3,
              line_v2: 2
            }
          ]
        }
      ])
    ).toEqual([2, 3]);
  });

  it("requires code_v2 specifically for QCF V2 layout readiness", () => {
    expect(
      hasQcfV2Layout([
        {
          id: 3,
          verse_number: 1,
          verse_key: "1:1",
          hizb_number: 1,
          rub_el_hizb_number: 1,
          ruku_number: 1,
          manzil_number: 1,
          text_uthmani: "بسم الله",
          page_number: 1,
          juz_number: 1,
          words: [
            {
              position: 1,
              verse_key: "1:1",
              char_type_name: "word",
              text_qpc_hafs: "بِسۡمِ",
              page_number: 1,
              line_number: 2
            }
          ]
        }
      ])
    ).toBe(false);
  });

  it("still builds line-based fallback rows when only unicode text is available", () => {
    const lines = buildMushafLayoutLines([
      {
        id: 4,
        verse_number: 1,
        verse_key: "1:1",
        hizb_number: 1,
        rub_el_hizb_number: 1,
        ruku_number: 1,
        manzil_number: 1,
        text_uthmani: "بسم الله",
        page_number: 1,
        juz_number: 1,
        words: [
          {
            position: 1,
            verse_key: "1:1",
            char_type_name: "word",
            text_qpc_hafs: "بِسۡمِ",
            page_number: 1,
            line_number: 2
          }
        ]
      }
    ]);

    expect(lines).toHaveLength(1);
    expect(lines[0].words[0].text).toBe("بِسۡمِ");
  });
});
