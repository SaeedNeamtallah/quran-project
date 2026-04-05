import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import Page from "@/components/QuranReader/ReadingView/Page";
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
        line_number: 1,
        v2_page: 604,
        line_v2: 8
      }
    ]
  }
];

describe("Page", () => {
  it("builds lines using the grouping page number rather than the visible page label", () => {
    const html = renderToStaticMarkup(
      <Page
        verses={verses}
        displayPageNumber={1}
        groupingPageNumber={604}
        isFontLoaded
        fontFamily="p604-v2"
        readingMode="strictMushaf"
        fontScale={3}
        verseAudioEnabled={false}
        pageTestId="reading-page"
        wordTestIdPrefix="word"
        lineTestIdBuilder={(lineNumber) => `line-${lineNumber}`}
      />
    );

    expect(html).toContain('data-testid="line-8"');
    expect(html).not.toContain("page-1-line-1");
  });
});
