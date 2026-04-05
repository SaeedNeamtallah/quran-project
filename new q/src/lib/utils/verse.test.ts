import { describe, expect, it } from "vitest";

import { getVerseReaderPath, shouldRenderBasmala } from "@/lib/utils/verse";

describe("verse helpers", () => {
  it("returns the matching reader route", () => {
    expect(getVerseReaderPath("rub")).toBe("/reader/rub");
    expect(getVerseReaderPath("page")).toBe("/reader/page");
  });

  it("renders basmala only for surah openings except 1 and 9", () => {
    expect(
      shouldRenderBasmala(
        {
          id: 1,
          verse_number: 1,
          verse_key: "2:1",
          hizb_number: 1,
          rub_el_hizb_number: 1,
          ruku_number: 1,
          manzil_number: 1,
          text_uthmani: "",
          page_number: 1,
          juz_number: 1,
          chapter_id: 2
        },
        1
      )
    ).toBe(true);

    expect(
      shouldRenderBasmala(
        {
          id: 1,
          verse_number: 1,
          verse_key: "1:1",
          hizb_number: 1,
          rub_el_hizb_number: 1,
          ruku_number: 1,
          manzil_number: 1,
          text_uthmani: "",
          page_number: 1,
          juz_number: 1,
          chapter_id: 1
        },
        0
      )
    ).toBe(false);
  });
});
