import { describe, expect, it } from "vitest";

import { groupPagesByVerses } from "@/components/QuranReader/ReadingView/groupPagesByVerses";
import type { QuranVerse } from "@/lib/types/quran";

describe("groupPagesByVerses", () => {
  it("indexes verses by all v2 pages referenced by their words", () => {
    const verses: QuranVerse[] = [
      {
        id: 1,
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
            text_qpc_hafs: "الم",
            code_v2: "ﲀ",
            page_number: 2,
            line_number: 1,
            v2_page: 2,
            line_v2: 1
          },
          {
            position: 2,
            verse_key: "2:1",
            char_type_name: "word",
            text_qpc_hafs: "ذلك",
            code_v2: "ﲁ",
            page_number: 3,
            line_number: 1,
            v2_page: 3,
            line_v2: 1
          }
        ]
      }
    ];

    const pages = groupPagesByVerses(verses);

    expect(Object.keys(pages).map(Number)).toEqual([2, 3]);
    expect(pages[2]?.[0]?.verse_key).toBe("2:1");
    expect(pages[3]?.[0]?.verse_key).toBe("2:1");
  });
});
