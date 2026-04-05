import { expect, test, type Page } from "@playwright/test";

const FAKE_AUDIO_URL = "data:audio/mpeg;base64,SUQzAwAAAAAA";

async function seedSettingsState(page: Page, state: Record<string, unknown>) {
  await page.addInitScript((nextState: Record<string, unknown>) => {
    localStorage.setItem(
      "quranic-pomodoro-next-settings",
      JSON.stringify({
        state: nextState,
        version: 0
      })
    );
  }, state);
}

function buildMockVerses() {
  return [
    {
      id: 1,
      verse_number: 1,
      verse_key: "1:1",
      hizb_number: 1,
      rub_el_hizb_number: 1,
      ruku_number: 1,
      manzil_number: 1,
      text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
      page_number: 1,
      juz_number: 1,
      chapter_id: 1,
      words: [
        {
          position: 1,
          verse_key: "1:1",
          char_type_name: "word",
          text_uthmani: "بِسْمِ",
          text_qpc_hafs: "بِسۡمِ",
          code_v2: "ﱁ",
          page_number: 1,
          line_number: 2,
          v2_page: 1,
          line_v2: 2
        },
        {
          position: 2,
          verse_key: "1:1",
          char_type_name: "word",
          text_uthmani: "اللَّهِ",
          text_qpc_hafs: "ٱللَّهِ",
          code_v2: "ﱂ",
          page_number: 1,
          line_number: 2,
          v2_page: 1,
          line_v2: 2
        },
        {
          position: 3,
          verse_key: "1:1",
          char_type_name: "end",
          text_uthmani: "١",
          text_qpc_hafs: "١",
          code_v2: "ﱃ",
          page_number: 1,
          line_number: 2,
          v2_page: 1,
          line_v2: 2
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
      text_uthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
      page_number: 1,
      juz_number: 1,
      chapter_id: 1,
      words: [
        {
          position: 1,
          verse_key: "1:2",
          char_type_name: "word",
          text_uthmani: "ٱلْحَمْدُ",
          text_qpc_hafs: "ٱلۡحَمۡدُ",
          code_v2: "ﱄ",
          page_number: 1,
          line_number: 3,
          v2_page: 1,
          line_v2: 3
        },
        {
          position: 2,
          verse_key: "1:2",
          char_type_name: "word",
          text_uthmani: "لِلَّهِ",
          text_qpc_hafs: "لِلَّهِ",
          code_v2: "ﱅ",
          page_number: 1,
          line_number: 3,
          v2_page: 1,
          line_v2: 3
        },
        {
          position: 3,
          verse_key: "1:2",
          char_type_name: "end",
          text_uthmani: "٢",
          text_qpc_hafs: "٢",
          code_v2: "ﱆ",
          page_number: 1,
          line_number: 3,
          v2_page: 1,
          line_v2: 3
        }
      ]
    }
  ];
}

function buildRubSpreadMockVerses() {
  return [
    {
      id: 21,
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
          text_uthmani: "الم",
          text_qpc_hafs: "الم",
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
          text_uthmani: "١",
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
      id: 22,
      verse_number: 2,
      verse_key: "2:2",
      hizb_number: 1,
      rub_el_hizb_number: 1,
      ruku_number: 1,
      manzil_number: 1,
      text_uthmani: "ذَٰلِكَ الْكِتَابُ",
      page_number: 3,
      juz_number: 1,
      chapter_id: 2,
      words: [
        {
          position: 1,
          verse_key: "2:2",
          char_type_name: "word",
          text_uthmani: "ذَٰلِكَ",
          text_qpc_hafs: "ذَٰلِكَ",
          code_v2: "ﲂ",
          page_number: 3,
          line_number: 2,
          v2_page: 3,
          line_v2: 2
        },
        {
          position: 2,
          verse_key: "2:2",
          char_type_name: "end",
          text_uthmani: "٢",
          text_qpc_hafs: "٢",
          code_v2: "ﲃ",
          page_number: 3,
          line_number: 2,
          v2_page: 3,
          line_v2: 2
        }
      ]
    },
    {
      id: 23,
      verse_number: 3,
      verse_key: "2:3",
      hizb_number: 1,
      rub_el_hizb_number: 1,
      ruku_number: 1,
      manzil_number: 1,
      text_uthmani: "هُدًى لِّلْمُتَّقِينَ",
      page_number: 4,
      juz_number: 1,
      chapter_id: 2,
      words: [
        {
          position: 1,
          verse_key: "2:3",
          char_type_name: "word",
          text_uthmani: "هُدًى",
          text_qpc_hafs: "هُدٗى",
          code_v2: "ﲄ",
          page_number: 4,
          line_number: 12,
          v2_page: 4,
          line_v2: 12
        },
        {
          position: 2,
          verse_key: "2:3",
          char_type_name: "end",
          text_uthmani: "٣",
          text_qpc_hafs: "٣",
          code_v2: "ﲅ",
          page_number: 4,
          line_number: 12,
          v2_page: 4,
          line_v2: 12
        }
      ]
    }
  ];
}

function buildRightColumnAlignmentRubMockVerses() {
  return [
    {
      id: 51,
      verse_number: 5,
      verse_key: "2:5",
      hizb_number: 1,
      rub_el_hizb_number: 1,
      ruku_number: 1,
      manzil_number: 1,
      text_uthmani: "أُولَٰئِكَ هُمُ الْمُفْلِحُونَ",
      page_number: 5,
      juz_number: 1,
      chapter_id: 2,
      words: [
        {
          position: 1,
          verse_key: "2:5",
          char_type_name: "word",
          text_uthmani: "أُولَٰئِكَ",
          text_qpc_hafs: "أُوْلَٰٓئِكَ",
          code_v2: "﵁",
          page_number: 5,
          line_number: 4,
          v2_page: 5,
          line_v2: 4
        },
        {
          position: 2,
          verse_key: "2:5",
          char_type_name: "end",
          text_uthmani: "٥",
          text_qpc_hafs: "٥",
          code_v2: "﵂",
          page_number: 5,
          line_number: 4,
          v2_page: 5,
          line_v2: 4
        }
      ]
    },
    {
      id: 71,
      verse_number: 7,
      verse_key: "2:7",
      hizb_number: 1,
      rub_el_hizb_number: 1,
      ruku_number: 1,
      manzil_number: 1,
      text_uthmani: "خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ",
      page_number: 7,
      juz_number: 1,
      chapter_id: 2,
      words: [
        {
          position: 1,
          verse_key: "2:7",
          char_type_name: "word",
          text_uthmani: "خَتَمَ",
          text_qpc_hafs: "خَتَمَ",
          code_v2: "﵃",
          page_number: 7,
          line_number: 6,
          v2_page: 7,
          line_v2: 6
        },
        {
          position: 2,
          verse_key: "2:7",
          char_type_name: "end",
          text_uthmani: "٧",
          text_qpc_hafs: "٧",
          code_v2: "﵄",
          page_number: 7,
          line_number: 6,
          v2_page: 7,
          line_v2: 6
        }
      ]
    },
    {
      id: 81,
      verse_number: 8,
      verse_key: "2:8",
      hizb_number: 1,
      rub_el_hizb_number: 1,
      ruku_number: 1,
      manzil_number: 1,
      text_uthmani: "وَمِنَ النَّاسِ مَن يَقُولُ",
      page_number: 8,
      juz_number: 1,
      chapter_id: 2,
      words: [
        {
          position: 1,
          verse_key: "2:8",
          char_type_name: "word",
          text_uthmani: "وَمِنَ",
          text_qpc_hafs: "وَمِنَ",
          code_v2: "﵅",
          page_number: 8,
          line_number: 3,
          v2_page: 8,
          line_v2: 3
        },
        {
          position: 2,
          verse_key: "2:8",
          char_type_name: "end",
          text_uthmani: "٨",
          text_qpc_hafs: "٨",
          code_v2: "﵆",
          page_number: 8,
          line_number: 3,
          v2_page: 8,
          line_v2: 3
        }
      ]
    }
  ];
}

function buildPartialRubPageMock() {
  const hiddenVerse = {
    id: 31,
    verse_number: 1,
    verse_key: "3:1",
    hizb_number: 1,
    rub_el_hizb_number: 1,
    ruku_number: 1,
    manzil_number: 1,
    text_uthmani: "الٓمٓ تِلْكَ آيَاتُ الْكِتَابِ الْمُبِينِ",
    page_number: 5,
    juz_number: 1,
    chapter_id: 3,
    words: [
      { position: 1, verse_key: "3:1", char_type_name: "word", text_uthmani: "الٓمٓ", text_qpc_hafs: "الٓمٓ", code_v2: "ﳐ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 },
      { position: 2, verse_key: "3:1", char_type_name: "word", text_uthmani: "تِلْكَ", text_qpc_hafs: "تِلۡكَ", code_v2: "ﳑ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 },
      { position: 3, verse_key: "3:1", char_type_name: "word", text_uthmani: "آيَاتُ", text_qpc_hafs: "ءَايَٰتُ", code_v2: "ﳒ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 },
      { position: 4, verse_key: "3:1", char_type_name: "word", text_uthmani: "الْكِتَابِ", text_qpc_hafs: "ٱلۡكِتَٰبِ", code_v2: "ﳓ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 },
      { position: 5, verse_key: "3:1", char_type_name: "word", text_uthmani: "الْمُبِينِ", text_qpc_hafs: "ٱلۡمُبِينِ", code_v2: "ﳔ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 },
      { position: 6, verse_key: "3:1", char_type_name: "end", text_uthmani: "١", text_qpc_hafs: "١", code_v2: "ﳕ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 }
    ]
  };

  const visibleVerse = {
    id: 32,
    verse_number: 2,
    verse_key: "3:2",
    hizb_number: 1,
    rub_el_hizb_number: 1,
    ruku_number: 1,
    manzil_number: 1,
    text_uthmani: "نَتْلُو عَلَيْكَ",
    page_number: 5,
    juz_number: 1,
    chapter_id: 3,
    words: [
      { position: 1, verse_key: "3:2", char_type_name: "word", text_uthmani: "نَتْلُو", text_qpc_hafs: "نَتۡلُواْ", code_v2: "ﳖ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 },
      { position: 2, verse_key: "3:2", char_type_name: "word", text_uthmani: "عَلَيْكَ", text_qpc_hafs: "عَلَيۡكَ", code_v2: "ﳗ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 },
      { position: 3, verse_key: "3:2", char_type_name: "end", text_uthmani: "٢", text_qpc_hafs: "٢", code_v2: "ﳘ", page_number: 5, line_number: 4, v2_page: 5, line_v2: 4 }
    ]
  };

  return {
    rubVerses: [visibleVerse],
    fullPageVerses: [hiddenVerse, visibleVerse]
  };
}

async function installInstantFontMocks(page: Page) {
  await page.addInitScript(() => {
    const loadedFonts: Array<{ family: string; status: string }> = [];
    const fontSet = {
      status: "loaded",
      add(font: { family: string; status: string }) {
        font.status = "loaded";
        loadedFonts.push(font);
        return this;
      },
      load() {
        return Promise.resolve(loadedFonts);
      },
      check() {
        return loadedFonts.length > 0;
      },
      has(font: { family: string; status?: string }) {
        return loadedFonts.some((loadedFont) => loadedFont.family === font.family);
      },
      delete() {
        return true;
      },
      clear() {
        loadedFonts.length = 0;
      },
      entries() {
        return loadedFonts.entries();
      },
      values() {
        return loadedFonts.values();
      },
      keys() {
        return loadedFonts.keys();
      },
      forEach(callback: (font: { family: string; status: string }) => void) {
        loadedFonts.forEach(callback);
      },
      get ready() {
        return Promise.resolve(fontSet);
      },
      [Symbol.iterator]() {
        return loadedFonts[Symbol.iterator]();
      }
    };

    class MockFontFace {
      family: string;
      source: string;
      status: string;

      constructor(family: string, source: string) {
        this.family = family;
        this.source = source;
        this.status = "unloaded";
      }

      async load() {
        this.status = "loaded";
        return this;
      }
    }

    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: fontSet
    });

    Object.defineProperty(window, "FontFace", {
      configurable: true,
      value: MockFontFace
    });
  });
}

async function installMediaMocks(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: function play() {
        queueMicrotask(() => {
          this.dispatchEvent(new Event("play"));

          if (
            (this as HTMLElement).dataset.playbackRole === "rub-recitation" ||
            (this as HTMLElement).dataset.playbackRole === "mushaf-page-recitation"
          ) {
            const dispatchTimedUpdate = (seconds: number, delayMs: number) => {
              window.setTimeout(() => {
                this.currentTime = seconds;
                this.dispatchEvent(new Event("timeupdate"));
              }, delayMs);
            };

            dispatchTimedUpdate(0.4, 0);
            dispatchTimedUpdate(0.4, 200);
            dispatchTimedUpdate(0.4, 600);
          }
        });

        return Promise.resolve();
      }
    });

    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: function pause() {
        queueMicrotask(() => {
          this.dispatchEvent(new Event("pause"));
        });
      }
    });

    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value: function load() {}
    });
  });
}

async function mockReaderBackend(page: Page) {
  const verses = buildMockVerses();

  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        offline: false,
        rubs: 240,
        pages: 604,
        chapters: 114,
        current_rub: 1,
        backendAvailable: true
      })
    });
  });

  await page.route("**/api/rub?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rub_number: 1,
        verses
      })
    });
  });

  await page.route("**/api/page?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verses
      })
    });
  });

  await page.route("**/api/set_rub", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        message: "ok",
        current_rub: 1
      })
    });
  });

  await page.route("**/api/recitations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        default_recitation_id: 7,
        recitations: [
          { id: 7, name: "Mock Qari", style: "murattal", label: "قارئ تجريبي" },
          { id: 8, name: "Another Mock", style: "murattal", label: "قارئ احتياطي" }
        ]
      })
    });
  });

  await page.route("**/api/verse_audio?**", async (route) => {
    const url = new URL(route.request().url());
    const verseKey = url.searchParams.get("verse_key") ?? "1:1";

    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verse_key: verseKey,
        verse_text: verseKey === "1:2" ? "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ" : "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
        recitation_id: 7,
        audio_url: FAKE_AUDIO_URL
      })
    });
  });

  await page.route("**/api/rub_recitation?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rub_number: 1,
        count: 1,
        recitation_id: 7,
        audio_files: [
          { verse_key: "1:1", url: FAKE_AUDIO_URL },
          { verse_key: "1:2", url: FAKE_AUDIO_URL }
        ]
      })
    });
  });

  await page.route("**/api/rub_word_timings?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rub_number: 1,
        count: 1,
        recitation_id: 7,
        word_timings: {
          "1:1": {
            verse_start_ms: 0,
            verse_end_ms: 1200,
            segments: [{ position: 1, start_ms: 0, end_ms: 800 }]
          },
          "1:2": {
            verse_start_ms: 1201,
            verse_end_ms: 2400,
            segments: [{ position: 1, start_ms: 1201, end_ms: 1800 }]
          }
        }
      })
    });
  });
}

async function mockRubSpreadBackend(page: Page) {
  const verses = buildRubSpreadMockVerses();
  const versesByPage = new Map([
    [2, [verses[0]]],
    [3, [verses[1]]],
    [4, [verses[2]]]
  ]);

  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        offline: false,
        rubs: 240,
        pages: 604,
        chapters: 114,
        current_rub: 1,
        backendAvailable: true
      })
    });
  });

  await page.route("**/api/rub?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rub_number: 1,
        verses
      })
    });
  });

  await page.route("**/api/page?**", async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "0");

    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verses: versesByPage.get(pageNumber) ?? []
      })
    });
  });

  await page.route("**/api/set_rub", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        message: "ok",
        current_rub: 1
      })
    });
  });

  await page.route("**/api/recitations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        default_recitation_id: 7,
        recitations: [{ id: 7, name: "Mock Qari", style: "murattal", label: "قارئ تجريبي" }]
      })
    });
  });
}

async function mockRightColumnAlignmentRubBackend(page: Page) {
  const verses = buildRightColumnAlignmentRubMockVerses();
  const versesByPage = new Map([
    [5, [verses[0]]],
    [7, [verses[1]]],
    [8, [verses[2]]]
  ]);

  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        offline: false,
        rubs: 240,
        pages: 604,
        chapters: 114,
        current_rub: 1,
        backendAvailable: true
      })
    });
  });

  await page.route("**/api/rub?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rub_number: 1,
        verses
      })
    });
  });

  await page.route("**/api/page?**", async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "0");

    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verses: versesByPage.get(pageNumber) ?? []
      })
    });
  });

  await page.route("**/api/set_rub", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        message: "ok",
        current_rub: 1
      })
    });
  });

  await page.route("**/api/recitations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        default_recitation_id: 7,
        recitations: [{ id: 7, name: "Mock Qari", style: "murattal", label: "قارئ تجريبي" }]
      })
    });
  });
}

async function mockPartialRubPageBackend(page: Page) {
  const { rubVerses, fullPageVerses } = buildPartialRubPageMock();

  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        offline: false,
        rubs: 240,
        pages: 604,
        chapters: 114,
        current_rub: 1,
        backendAvailable: true
      })
    });
  });

  await page.route("**/api/rub?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rub_number: 1,
        verses: rubVerses
      })
    });
  });

  await page.route("**/api/page?**", async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("page") ?? "0");

    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verses: pageNumber === 5 ? fullPageVerses : []
      })
    });
  });

  await page.route("**/api/set_rub", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        message: "ok",
        current_rub: 1
      })
    });
  });

  await page.route("**/api/recitations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        default_recitation_id: 7,
        recitations: [{ id: 7, name: "Mock Qari", style: "murattal", label: "قارئ تجريبي" }]
      })
    });
  });
}

async function mockMushafBackend(page: Page) {
  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        offline: false,
        rubs: 240,
        pages: 604,
        chapters: 114,
        current_rub: 1,
        backendAvailable: true
      })
    });
  });

  await page.route("**/api/page?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verses: [
          {
            id: 1,
            verse_number: 1,
            verse_key: "1:1",
            hizb_number: 1,
            rub_el_hizb_number: 1,
            ruku_number: 1,
            manzil_number: 1,
            text_uthmani: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
            page_number: 1,
            juz_number: 1,
            chapter_id: 1,
            words: [
              {
                position: 1,
                verse_key: "1:1",
                char_type_name: "word",
                text_uthmani: "بِسْمِ",
                text_qpc_hafs: "بِسۡمِ",
                code_v2: "ﱁ",
                line_number: 2,
                line_v2: 2,
                page_number: 1,
                v2_page: 1
              },
              {
                position: 2,
                verse_key: "1:1",
                char_type_name: "word",
                text_uthmani: "اللَّهِ",
                text_qpc_hafs: "ٱللَّهِ",
                code_v2: "ﱂ",
                line_number: 2,
                line_v2: 2,
                page_number: 1,
                v2_page: 1
              },
              {
                position: 3,
                verse_key: "1:1",
                char_type_name: "end",
                text_uthmani: "١",
                text_qpc_hafs: "١",
                code_v2: "ﱃ",
                line_number: 2,
                line_v2: 2,
                page_number: 1,
                v2_page: 1
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
            text_uthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
            page_number: 1,
            juz_number: 1,
            chapter_id: 1,
            words: [
              {
                position: 1,
                verse_key: "1:2",
                char_type_name: "word",
                text_uthmani: "ٱلْحَمْدُ",
                text_qpc_hafs: "ٱلۡحَمۡدُ",
                code_v2: "ﱄ",
                line_number: 3,
                line_v2: 3,
                page_number: 1,
                v2_page: 1
              },
              {
                position: 2,
                verse_key: "1:2",
                char_type_name: "end",
                text_uthmani: "٢",
                text_qpc_hafs: "٢",
                code_v2: "ﱅ",
                line_number: 3,
                line_v2: 3,
                page_number: 1,
                v2_page: 1
              }
            ]
          }
        ]
      })
    });
  });

  await page.route("**/api/recitations", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        default_recitation_id: 7,
        recitations: [{ id: 7, name: "Mock Qari", style: "murattal", label: "قارئ تجريبي" }]
      })
    });
  });

  await page.route("**/api/page_recitation?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        page_number: 1,
        recitation_id: 7,
        audio_files: [
          { verse_key: "1:1", url: FAKE_AUDIO_URL },
          { verse_key: "1:2", url: FAKE_AUDIO_URL }
        ]
      })
    });
  });

  await page.route("**/api/page_word_timings?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        page_number: 1,
        recitation_id: 7,
        word_timings: {
          "1:1": {
            verse_start_ms: 0,
            verse_end_ms: 1200,
            segments: [{ position: 1, start_ms: 0, end_ms: 800 }]
          },
          "1:2": {
            verse_start_ms: 0,
            verse_end_ms: 1200,
            segments: [{ position: 1, start_ms: 0, end_ms: 800 }]
          }
        }
      })
    });
  });

  await page.route("**/api/verse_audio?**", async (route) => {
    const url = new URL(route.request().url());
    const verseKey = url.searchParams.get("verse_key") ?? "1:1";

    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verse_key: verseKey,
        verse_text: verseKey === "1:2" ? "ٱلْحَمْدُ لِلَّهِ" : "بِسْمِ اللَّهِ",
        recitation_id: 7,
        audio_url: FAKE_AUDIO_URL
      })
    });
  });
}

test("supports verse preview, rub recitation, and timed word highlighting when backend features are available", async ({
  page
}) => {
  await installInstantFontMocks(page);
  await installMediaMocks(page);
  await mockReaderBackend(page);

  await page.goto("/reader/rub");

  const soundTrigger = page.getByTestId("reader-sound-trigger");
  const readerPageSheet = page.getByTestId("reader-page-sheet-1");
  const verseOneCard = page.getByTestId("verse-card-1-1");
  const verseTwoCard = page.getByTestId("verse-card-1-2");
  const verseOneWord = page.getByTestId("word-1-1-1");
  const verseTwoWord = page.getByTestId("word-1-2-1");
  const highlightedWord = page.getByTestId("word-1-1-1");

  await expect(soundTrigger).toBeEnabled();
  await expect(readerPageSheet).toBeVisible();
  await expect(verseOneWord).toBeVisible();

  await verseOneWord.click();
  await expect(verseOneCard).toHaveAttribute("data-audio-state", "manual");
  await expect(verseOneWord).toHaveAttribute("data-verse-state", "manual");
  await expect(soundTrigger).toHaveAttribute("data-recitation-state", "idle");

  await soundTrigger.click();
  await expect(page.getByTestId("reader-reciter-dialog")).toBeVisible();
  await page.getByTestId("reciter-option-7").click();
  await expect(page.getByTestId("reader-reciter-dialog")).toHaveCount(0);
  await expect(verseOneCard).toHaveAttribute("data-audio-state", "recitation");
  await expect(highlightedWord).toHaveAttribute("data-word-active", "true");
  await expect(verseOneWord).toHaveAttribute("data-verse-state", "recitation");
  await expect(page.getByTestId("word-1-1-2")).toHaveAttribute("data-verse-state", "recitation");
  await expect(soundTrigger).toHaveAttribute("data-recitation-state", "playing");

  await verseTwoWord.click();
  await expect(soundTrigger).toHaveAttribute("data-recitation-state", "idle");
  await expect(verseOneCard).toHaveAttribute("data-audio-state", "idle");
  await expect(verseTwoCard).toHaveAttribute("data-audio-state", "manual");
  await expect(verseTwoWord).toHaveAttribute("data-verse-state", "manual");
});

test("renders rub pages as physical spreads and leaves the opposite slot empty when the rub starts on a left page", async ({
  page
}) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2 });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  const firstSpread = page.getByTestId("reader-page-spread-1");
  const secondSpread = page.getByTestId("reader-page-spread-2");

  await expect(firstSpread).toBeVisible();
  await expect(firstSpread.getByTestId("reader-page-slot-right-1")).toHaveAttribute("data-slot-state", "empty");
  await expect(firstSpread.getByTestId("reader-page-slot-left-1")).toHaveAttribute("data-slot-state", "filled");
  await expect(firstSpread.getByTestId("reader-page-sheet-2")).toBeVisible();

  await expect(secondSpread.getByTestId("reader-page-slot-right-2")).toHaveAttribute("data-slot-state", "filled");
  await expect(secondSpread.getByTestId("reader-page-slot-left-2")).toHaveAttribute("data-slot-state", "filled");
  await expect(secondSpread.getByTestId("reader-page-sheet-3")).toBeVisible();
  await expect(secondSpread.getByTestId("reader-page-sheet-4")).toBeVisible();

  const leftPageBox = await secondSpread.getByTestId("reader-page-sheet-4").boundingBox();
  const rightPageBox = await secondSpread.getByTestId("reader-page-sheet-3").boundingBox();
  const leftPageWordBox = await secondSpread.getByTestId("word-2-3-1").boundingBox();
  const rightPageWordBox = await secondSpread.getByTestId("word-2-2-1").boundingBox();

  expect(leftPageBox).not.toBeNull();
  expect(rightPageBox).not.toBeNull();
  expect(leftPageWordBox).not.toBeNull();
  expect(rightPageWordBox).not.toBeNull();
  expect((leftPageBox?.x ?? 0) + (leftPageBox?.width ?? 0)).toBeLessThan((rightPageBox?.x ?? 0) - 4);
  expect((leftPageWordBox?.y ?? 0) - (rightPageWordBox?.y ?? 0)).toBeGreaterThan(120);
});

test("renders the surah name and basmala before a new surah like quran.com", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2 });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  const firstSpread = page.getByTestId("reader-page-spread-1");
  const surahTitle = page.getByTestId("surah-intro-2-1");
  const basmala = page.getByTestId("surah-intro-2-2");

  await expect(firstSpread).toBeVisible();
  await expect(surahTitle).toContainText("سورة البقرة");
  await expect(basmala).toContainText("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
});

test("uses the available desktop width for rub spreads without crowding the center", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2 });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  await expect(page.getByTestId("reader-page-spread-2")).toBeVisible();
  const spreadBox = await page.getByTestId("reader-page-spread-2").boundingBox();
  const viewport = page.viewportSize();

  expect(spreadBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(spreadBox?.width ?? 0).toBeGreaterThan((viewport?.width ?? 0) * 0.55);
});

test("positions all page numbers slightly inset from the bottom-right corner of each rub page", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2 });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  const rightPage = page.getByTestId("reader-page-sheet-3");
  const leftPage = page.getByTestId("reader-page-sheet-4");
  const rightPageFooter = page.getByTestId("page-footer-3");
  const leftPageFooter = page.getByTestId("page-footer-4");

  await expect(rightPage).toBeVisible();
  await expect(leftPage).toBeVisible();
  await expect(rightPageFooter).toBeVisible();
  await expect(leftPageFooter).toBeVisible();
  await expect(rightPageFooter).toHaveCSS("color", "rgb(107, 114, 128)");
  await expect(leftPageFooter).toHaveCSS("color", "rgb(107, 114, 128)");

  const rightPageBox = await rightPage.boundingBox();
  const leftPageBox = await leftPage.boundingBox();
  const rightPageFooterBox = await rightPageFooter.boundingBox();
  const leftPageFooterBox = await leftPageFooter.boundingBox();

  expect(rightPageBox).not.toBeNull();
  expect(leftPageBox).not.toBeNull();
  expect(rightPageFooterBox).not.toBeNull();
  expect(leftPageFooterBox).not.toBeNull();
  expect((rightPageBox?.x ?? 0) + (rightPageBox?.width ?? 0) - ((rightPageFooterBox?.x ?? 0) + (rightPageFooterBox?.width ?? 0))).toBeGreaterThan(16);
  expect((rightPageBox?.x ?? 0) + (rightPageBox?.width ?? 0) - ((rightPageFooterBox?.x ?? 0) + (rightPageFooterBox?.width ?? 0))).toBeLessThan(52);
  expect((leftPageBox?.x ?? 0) + (leftPageBox?.width ?? 0) - ((leftPageFooterBox?.x ?? 0) + (leftPageFooterBox?.width ?? 0))).toBeGreaterThan(16);
  expect((leftPageBox?.x ?? 0) + (leftPageBox?.width ?? 0) - ((leftPageFooterBox?.x ?? 0) + (leftPageFooterBox?.width ?? 0))).toBeLessThan(52);
  expect((rightPageBox?.y ?? 0) + (rightPageBox?.height ?? 0) - ((rightPageFooterBox?.y ?? 0) + (rightPageFooterBox?.height ?? 0))).toBeGreaterThan(4);
  expect((rightPageBox?.y ?? 0) + (rightPageBox?.height ?? 0) - ((rightPageFooterBox?.y ?? 0) + (rightPageFooterBox?.height ?? 0))).toBeLessThan(28);
  expect((leftPageBox?.y ?? 0) + (leftPageBox?.height ?? 0) - ((leftPageFooterBox?.y ?? 0) + (leftPageFooterBox?.height ?? 0))).toBeGreaterThan(4);
  expect((leftPageBox?.y ?? 0) + (leftPageBox?.height ?? 0) - ((leftPageFooterBox?.y ?? 0) + (leftPageFooterBox?.height ?? 0))).toBeLessThan(28);
});

test("keeps right-side rub pages aligned across stacked spreads", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2 });
  await mockRightColumnAlignmentRubBackend(page);

  await page.goto("/reader/rub");

  const firstSpreadRightPage = page.getByTestId("reader-page-sheet-5");
  const secondSpreadRightPage = page.getByTestId("reader-page-sheet-7");

  await expect(firstSpreadRightPage).toBeVisible();
  await expect(secondSpreadRightPage).toBeVisible();

  const firstSpreadRightBox = await firstSpreadRightPage.boundingBox();
  const secondSpreadRightBox = await secondSpreadRightPage.boundingBox();

  expect(firstSpreadRightBox).not.toBeNull();
  expect(secondSpreadRightBox).not.toBeNull();
  expect(Math.abs((firstSpreadRightBox?.x ?? 0) - (secondSpreadRightBox?.x ?? 0))).toBeLessThan(3);
});

test("supports horizontal scrolling and hover highlighting in stacked reading mode", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2 });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  const viewport = page.getByTestId("reader-page-stage").locator("xpath=..");
  const secondSpread = page.getByTestId("reader-page-spread-2");
  const hoverWord = page.getByTestId("word-2-2-1");
  const hoverWordGlyph = hoverWord.locator("span").first();
  const hoverAyah = page.getByTestId("mushaf-ayah-2-1");
  const hoverAyahGlyph = hoverAyah.locator("span").first();

  await expect(viewport).toHaveCSS("overflow-x", "auto");
  await expect(secondSpread).toHaveCSS("border-top-width", "1px");

  await hoverWord.hover();
  await expect(hoverWordGlyph).toHaveCSS("color", "rgb(180, 83, 9)");

  await hoverAyah.hover();
  await expect(hoverAyahGlyph).toHaveCSS("color", "rgb(180, 83, 9)");
});

test("adds extra horizontal and vertical separation in smooth zoom mode", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2, mushafZoomMode: "smooth" });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  const zoomInButton = page.getByRole("button", { name: "تكبير الصفحة" });
  for (let index = 0; index < 6; index += 1) {
    await zoomInButton.click();
  }

  const firstSpread = page.getByTestId("reader-page-spread-1");
  const secondSpread = page.getByTestId("reader-page-spread-2");
  const leftPage = secondSpread.getByTestId("reader-page-sheet-4");
  const rightPage = secondSpread.getByTestId("reader-page-sheet-3");

  await expect(firstSpread).toBeVisible();
  await expect(secondSpread).toBeVisible();
  await expect(leftPage).toBeVisible();
  await expect(rightPage).toBeVisible();

  const firstSpreadBox = await firstSpread.boundingBox();
  const secondSpreadBox = await secondSpread.boundingBox();
  const leftPageBox = await leftPage.boundingBox();
  const rightPageBox = await rightPage.boundingBox();

  expect(firstSpreadBox).not.toBeNull();
  expect(secondSpreadBox).not.toBeNull();
  expect(leftPageBox).not.toBeNull();
  expect(rightPageBox).not.toBeNull();
  expect((rightPageBox?.x ?? 0) - ((leftPageBox?.x ?? 0) + (leftPageBox?.width ?? 0))).toBeGreaterThan(40);
  expect((secondSpreadBox?.y ?? 0) - ((firstSpreadBox?.y ?? 0) + (firstSpreadBox?.height ?? 0))).toBeGreaterThan(36);
});

test("enables horizontal scrolling in reading mode when the spread exceeds the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 720 });
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2, mushafZoomMode: "smooth" });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  const zoomInButton = page.getByRole("button", { name: "تكبير الصفحة" });
  for (let index = 0; index < 10; index += 1) {
    await zoomInButton.click();
  }

  const metrics = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('[data-testid="reader-page-stage"]');
    let node = stage?.parentElement ?? null;

    while (node) {
      if (getComputedStyle(node).overflowX === "auto") {
        return {
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth
        };
      }

      node = node.parentElement;
    }

    return { scrollWidth: 0, clientWidth: 0 };
  });

  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
});

test("keeps rub spreads separated on narrow viewports", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 420 });
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 2 });
  await mockRubSpreadBackend(page);

  await page.goto("/reader/rub");

  const targetSpread = page.getByTestId("reader-page-spread-2");
  const leftPage = targetSpread.getByTestId("reader-page-sheet-4");
  const rightPage = targetSpread.getByTestId("reader-page-sheet-3");

  await expect(leftPage).toBeVisible();
  await expect(rightPage).toBeVisible();

  const leftPageBox = await leftPage.boundingBox();
  const rightPageBox = await rightPage.boundingBox();

  expect(leftPageBox).not.toBeNull();
  expect(rightPageBox).not.toBeNull();
  const horizontalOverlap = Math.max(
    0,
    Math.min((leftPageBox?.x ?? 0) + (leftPageBox?.width ?? 0), (rightPageBox?.x ?? 0) + (rightPageBox?.width ?? 0)) -
      Math.max(leftPageBox?.x ?? 0, rightPageBox?.x ?? 0)
  );
  expect(horizontalOverlap).toBeLessThan(2);
});

test("renders rub verses inside their original page positions when the rub starts mid-page", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { rubPageSpreadCount: 1 });
  await mockPartialRubPageBackend(page);

  await page.goto("/reader/rub");

  const targetSheet = page.getByTestId("reader-page-sheet-5");
  const hiddenLeadingWord = page.getByTestId("word-3-1-1");
  const hiddenLeadingAyahMarker = page.getByTestId("mushaf-ayah-3-1");
  const visibleRubWord = page.getByTestId("word-3-2-1");

  await expect(targetSheet).toBeVisible();
  await expect(hiddenLeadingWord).toBeHidden();
  await expect(hiddenLeadingAyahMarker).toBeVisible();
  await expect(visibleRubWord).toBeVisible();

  const sheetBox = await targetSheet.boundingBox();
  const visibleWordBox = await visibleRubWord.boundingBox();

  expect(sheetBox).not.toBeNull();
  expect(visibleWordBox).not.toBeNull();
  expect((sheetBox?.x ?? 0) + (sheetBox?.width ?? 0) - ((visibleWordBox?.x ?? 0) + (visibleWordBox?.width ?? 0))).toBeGreaterThan(40);
});

test("highlights the hovered word and verse in reading mode", async ({ page }) => {
  await installInstantFontMocks(page);
  await mockMushafBackend(page);

  await page.goto("/reader/page");

  const verseWord = page.getByTestId("mushaf-word-1-1-1");
  const verseSecondWord = page.getByTestId("mushaf-word-1-1-2");
  const verseMarker = page.getByTestId("mushaf-ayah-1-1");
  const verseWordGlyph = verseWord.locator("span").first();
  const verseSecondWordGlyph = verseSecondWord.locator("span").first();
  const verseMarkerGlyph = verseMarker.locator("span").first();

  await verseWord.hover();
  await expect(verseWordGlyph).toHaveCSS("color", "rgb(180, 83, 9)");
  await expect(verseSecondWordGlyph).toHaveCSS("color", "rgb(15, 118, 110)");

  await verseMarker.hover();
  await expect(verseMarkerGlyph).toHaveCSS("color", "rgb(180, 83, 9)");
  await expect(verseWordGlyph).toHaveCSS("color", "rgb(15, 118, 110)");
});

test("supports page recitation tracking and highlights the active mushaf word", async ({ page }) => {
  await installInstantFontMocks(page);
  await installMediaMocks(page);
  await mockMushafBackend(page);

  await page.goto("/reader/page");

  const soundTrigger = page.getByTestId("mushaf-sound-trigger");
  const firstWord = page.getByTestId("mushaf-word-1-1-1");
  const secondVerseWord = page.getByTestId("mushaf-word-1-2-1");

  await expect(soundTrigger).toBeEnabled();
  await expect(firstWord).toBeVisible();

  await soundTrigger.click();
  await expect(page.getByTestId("mushaf-reciter-dialog")).toBeVisible();
  await page.getByTestId("mushaf-reciter-option-7").click();
  await expect(page.getByTestId("mushaf-reciter-dialog")).toHaveCount(0);
  await expect(soundTrigger).toHaveAttribute("data-recitation-state", "playing");
  await expect(firstWord).toHaveAttribute("data-word-active", "true");
  await expect(firstWord).toHaveAttribute("data-verse-state", "recitation");
  await expect(page.getByTestId("mushaf-ayah-1-1")).toHaveAttribute("data-verse-state", "recitation");

  await secondVerseWord.click();
  await expect(soundTrigger).toHaveAttribute("data-recitation-state", "idle");
  await expect(page.getByTestId("mushaf-word-1-2-1")).toHaveAttribute("data-verse-active", "true");
  await expect(page.getByTestId("mushaf-word-1-2-1")).toHaveAttribute("data-verse-state", "manual");
});

test("highlights the hovered ayah and hovered word in reading view without changing active recitation colors", async ({
  page
}) => {
  await installInstantFontMocks(page);
  await mockReaderBackend(page);

  await page.goto("/reader/rub");

  const hoveredWord = page.getByTestId("word-1-1-1");
  const siblingWord = page.getByTestId("word-1-1-2");
  const hoveredGlyph = hoveredWord.locator("span").first();
  const siblingGlyph = siblingWord.locator("span").first();

  await expect(hoveredWord).toBeVisible();
  await expect(siblingWord).toBeVisible();

  await hoveredWord.hover();

  await expect(hoveredGlyph).toHaveCSS("color", "rgb(180, 83, 9)");
  await expect(siblingGlyph).toHaveCSS("color", "rgb(15, 118, 110)");
  await expect(hoveredWord).toHaveAttribute("data-verse-active", "false");
  await expect(siblingWord).toHaveAttribute("data-verse-active", "false");
});
