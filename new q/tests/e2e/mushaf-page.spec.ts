import { expect, test } from "@playwright/test";

async function installInstantFontMocks(page: import("@playwright/test").Page) {
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

async function seedSettingsState(page: import("@playwright/test").Page, state: Record<string, unknown>) {
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

async function seedReaderState(page: import("@playwright/test").Page, state: Record<string, unknown>) {
  await page.addInitScript((nextState: Record<string, unknown>) => {
    localStorage.setItem(
      "quranic-pomodoro-next-reader",
      JSON.stringify({
        state: nextState,
        version: 0
      })
    );
  }, state);
}

test("renders a QCF V2 mushaf sheet when page layout data is available", async ({ page }) => {
  await installInstantFontMocks(page);

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
                char_type_name: "end",
                text_qpc_hafs: "١",
                code_v2: "ﱂ",
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
            text_uthmani: "ٱلْحَمْدُ لِلَّهِ",
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
                line_number: 3,
                line_v2: 3,
                page_number: 1,
                v2_page: 1
              }
            ]
          },
          {
            id: 7,
            verse_number: 7,
            verse_key: "1:7",
            hizb_number: 1,
            rub_el_hizb_number: 1,
            ruku_number: 1,
            manzil_number: 1,
            text_uthmani: "غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ",
            page_number: 1,
            juz_number: 1,
            chapter_id: 1,
            words: [
              {
                position: 1,
                verse_key: "1:7",
                char_type_name: "word",
                text_qpc_hafs: "غَيۡرِ",
                code_v2: "ﱇ",
                line_number: 7,
                line_v2: 7,
                page_number: 1,
                v2_page: 1
              },
              {
                position: 2,
                verse_key: "1:7",
                char_type_name: "word",
                text_qpc_hafs: "ٱلۡمَغۡضُوبِ",
                code_v2: "ﱈ",
                line_number: 7,
                line_v2: 7,
                page_number: 1,
                v2_page: 1
              },
              {
                position: 3,
                verse_key: "1:7",
                char_type_name: "word",
                text_qpc_hafs: "عَلَيۡهِمۡ",
                code_v2: "ﱉ",
                line_number: 7,
                line_v2: 7,
                page_number: 1,
                v2_page: 1
              },
              {
                position: 4,
                verse_key: "1:7",
                char_type_name: "end",
                text_qpc_hafs: "٧",
                code_v2: "ﱊ",
                line_number: 7,
                line_v2: 7,
                page_number: 1,
                v2_page: 1
              }
            ]
          }
        ]
      })
    });
  });

  await page.goto("/reader/page");

  await expect(page).toHaveURL(/\/reader\/page$/);
  await expect(page.getByTestId("mushaf-page-sheet")).toBeVisible();
  await expect(page.getByTestId("mushaf-page-sheet")).toHaveAttribute("data-render-mode", "glyph");
  await expect(page.getByTestId("mushaf-line-2")).toBeVisible();
  await expect(page.getByTestId("mushaf-line-3")).toBeVisible();
  await expect(page.getByTestId("mushaf-line-7")).toHaveAttribute("data-line-grouping", "line-number");
  await expect(page.locator('a[href="/reader/rub"]').first()).toBeVisible();
  await expect(page.locator('a[href*="/tafsir/1%3A1"]')).toHaveCount(1);
  await expect(page.getByTestId("mushaf-ayah-1-1").locator("span")).toHaveText("١");
  await expect(page.getByTestId("mushaf-ayah-1-7").locator("span")).toHaveText("٧");

  const zoomInButton = page.getByRole("button", { name: "تكبير الصفحة" });
  for (let index = 0; index < 20; index += 1) {
    if (await zoomInButton.isDisabled()) break;
    await zoomInButton.click();
  }

  await expect(zoomInButton).toBeDisabled();
  await expect(page.getByTestId("mushaf-page-stage")).not.toHaveClass(/sticky/);
  await expect(page.getByTestId("mushaf-page-stage")).toHaveCSS("min-height", /.+/);
});

test("keeps regular mushaf lines shrink-to-fit instead of distributing words across the full line width", async ({ page }) => {
  await installInstantFontMocks(page);

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
            id: 255,
            verse_number: 1,
            verse_key: "2:25",
            hizb_number: 1,
            rub_el_hizb_number: 1,
            ruku_number: 1,
            manzil_number: 1,
            text_uthmani: "وَبَشِّرِ الَّذِينَ آمَنُوا",
            page_number: 3,
            juz_number: 1,
            chapter_id: 2,
            words: [
              {
                position: 1,
                verse_key: "2:25",
                char_type_name: "word",
                text_qpc_hafs: "وَبَشِّرِ",
                code_v2: "ﱁ",
                line_number: 1,
                line_v2: 1,
                page_number: 3,
                v2_page: 3
              },
              {
                position: 2,
                verse_key: "2:25",
                char_type_name: "word",
                text_qpc_hafs: "ٱلَّذِينَ",
                code_v2: "ﱂ",
                line_number: 1,
                line_v2: 1,
                page_number: 3,
                v2_page: 3
              },
              {
                position: 3,
                verse_key: "2:25",
                char_type_name: "word",
                text_qpc_hafs: "ءَامَنُواْ",
                code_v2: "ﱃ",
                line_number: 1,
                line_v2: 1,
                page_number: 3,
                v2_page: 3
              },
              {
                position: 4,
                verse_key: "2:25",
                char_type_name: "end",
                text_qpc_hafs: "٢٥",
                code_v2: "ﱄ",
                line_number: 1,
                line_v2: 1,
                page_number: 3,
                v2_page: 3
              }
            ]
          }
        ]
      })
    });
  });

  await page.goto("/reader/page");

  const lineLayout = await page.getByTestId("mushaf-line-1").evaluate((node) => {
    const verseText = node.querySelector('[data-testid^="verse-arabic-"] > div') as HTMLElement | null;
    const verseTextStyle = verseText ? getComputedStyle(verseText) : null;

    return {
      verseDisplay: verseTextStyle?.display ?? null,
      verseJustifyContent: verseTextStyle?.justifyContent ?? null
    };
  });

  expect(["flex", "inline-flex"]).toContain(lineLayout.verseDisplay);
  expect(lineLayout.verseJustifyContent).not.toBe("space-between");
});

test("aligns the current mushaf page to its physical side in two-slot mode", async ({ page }) => {
  await installInstantFontMocks(page);
  await seedSettingsState(page, { mushafPageDisplayCount: 2 });
  await seedReaderState(page, { mushafPage: 1, lastReaderRoute: "/reader/page" });
  const requestedPages: number[] = [];

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
    const url = new URL(route.request().url());
    const requestedPage = Number(url.searchParams.get("page") ?? "1");
    requestedPages.push(requestedPage);

    const versesByPage: Record<number, unknown[]> = {
      1: [
        {
          id: 1,
          verse_number: 1,
          verse_key: "1:1",
          hizb_number: 1,
          rub_el_hizb_number: 1,
          ruku_number: 1,
          manzil_number: 1,
          text_uthmani: "بِسْمِ اللَّهِ",
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
              line_number: 2,
              line_v2: 2,
              page_number: 1,
              v2_page: 1
            },
            {
              position: 2,
              verse_key: "1:1",
              char_type_name: "end",
              text_qpc_hafs: "١",
              code_v2: "ﱂ",
              line_number: 2,
              line_v2: 2,
              page_number: 1,
              v2_page: 1
            }
          ]
        }
      ],
      2: [
        {
          id: 2,
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
              line_number: 12,
              line_v2: 12,
              page_number: 2,
              v2_page: 2
            },
            {
              position: 2,
              verse_key: "2:1",
              char_type_name: "end",
              text_qpc_hafs: "١",
              code_v2: "ﲁ",
              line_number: 12,
              line_v2: 12,
              page_number: 2,
              v2_page: 2
            }
          ]
        }
      ],
      3: [
        {
          id: 3,
          verse_number: 1,
          verse_key: "3:1",
          hizb_number: 1,
          rub_el_hizb_number: 1,
          ruku_number: 1,
          manzil_number: 1,
          text_uthmani: "تِلْكَ آيَاتُ",
          page_number: 3,
          juz_number: 1,
          chapter_id: 3,
          words: [
            {
              position: 1,
              verse_key: "3:1",
              char_type_name: "word",
              text_qpc_hafs: "تِلۡكَ",
              code_v2: "ﲂ",
              line_number: 4,
              line_v2: 4,
              page_number: 3,
              v2_page: 3
            },
            {
              position: 2,
              verse_key: "3:1",
              char_type_name: "end",
              text_qpc_hafs: "١",
              code_v2: "ﲃ",
              line_number: 4,
              line_v2: 4,
              page_number: 3,
              v2_page: 3
            }
          ]
        }
      ]
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        verses: versesByPage[requestedPage] ?? []
      })
    });
  });

  await page.goto("/reader/page");

  const firstSpread = page.getByTestId("reader-page-spread-1");
  const leftSlot = firstSpread.getByTestId("reader-page-slot-left-1");
  const rightSlot = firstSpread.getByTestId("reader-page-slot-right-1");
  const nextButton = page.getByRole("button", { name: "الصفحة التالية" });
  const previousButton = page.getByRole("button", { name: "الصفحة السابقة" });

  const assertAlignmentForPage = async (pageNumber: number) => {
    const verseKey = `${pageNumber}:1`;

    if (pageNumber % 2 === 1) {
      await expect(leftSlot).toHaveAttribute("data-slot-state", "empty");
      await expect(rightSlot).toHaveAttribute("data-slot-state", "filled");
      await expect(rightSlot.getByRole("button", { name: `تشغيل الآية ${verseKey}` })).toBeVisible();
      await expect(leftSlot.getByRole("button", { name: `تشغيل الآية ${verseKey}` })).toHaveCount(0);
      return;
    }

    await expect(leftSlot).toHaveAttribute("data-slot-state", "filled");
    await expect(rightSlot).toHaveAttribute("data-slot-state", "empty");
    await expect(leftSlot.getByRole("button", { name: `تشغيل الآية ${verseKey}` })).toBeVisible();
    await expect(rightSlot.getByRole("button", { name: `تشغيل الآية ${verseKey}` })).toHaveCount(0);
  };

  await expect(firstSpread).toBeVisible();
  await expect(nextButton).toBeEnabled();
  await expect.poll(() => requestedPages.length).toBeGreaterThan(0);

  const firstPageNumber = requestedPages.at(-1) ?? 1;
  await assertAlignmentForPage(firstPageNumber);

  await nextButton.click();
  const secondPageNumber = firstPageNumber >= 604 ? 1 : firstPageNumber + 1;
  await expect.poll(() => requestedPages.at(-1) ?? 0).toBe(secondPageNumber);
  await assertAlignmentForPage(secondPageNumber);

  await previousButton.click();
  await assertAlignmentForPage(firstPageNumber);
});

test("falls back to readable line-based page text when the QCF page font fails to load", async ({ page }) => {
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
                text_qpc_hafs: "بِسۡمِ",
                text_uthmani: "بِسْمِ",
                code_v2: "ﱁ",
                line_number: 2,
                line_v2: 2,
                page_number: 604,
                v2_page: 604
              },
              {
                position: 2,
                verse_key: "1:1",
                char_type_name: "end",
                text_qpc_hafs: "١",
                text_uthmani: "١",
                code_v2: "ﱂ",
                line_number: 2,
                line_v2: 2,
                page_number: 604,
                v2_page: 604
              }
            ]
          }
        ]
      })
    });
  });

  await page.route("**/fonts/quran/hafs/v2/**/p604.*", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/reader/page");

  await expect(page.getByTestId("mushaf-page-sheet")).toBeVisible();
  await expect(page.getByTestId("mushaf-page-sheet")).toHaveAttribute("data-render-mode", "fallback-text");
  await expect(page.getByTestId("mushaf-word-1-1-1")).toBeVisible();
  await expect(page.getByTestId("mushaf-word-1-1-1")).toContainText("بِسۡمِ");
});

test("does not fall back to verse cards when Quran.com layout data is missing", async ({ page }) => {
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
            words: []
          }
        ]
      })
    });
  });

  await page.goto("/reader/page");

  await expect(page.getByText("لا توجد بيانات QCF V2 صالحة أو مجمعة سطريًا لبناء هذه الصفحة الآن.")).toBeVisible();
  await expect(page.getByTestId("mushaf-page-sheet")).toHaveCount(0);
  await expect(page.locator('[data-testid^="verse-card-"]')).toHaveCount(0);
});
