import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

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

async function seedTimerState(page: Page, state: Record<string, unknown>) {
  await page.evaluate((nextState: Record<string, unknown>) => {
    localStorage.setItem(
      "quranic-pomodoro-next-timer",
      JSON.stringify({
        state: nextState,
        version: 0
      })
    );
  }, state);
}

async function installSettingsState(page: Page, state: Record<string, unknown>) {
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

async function mockRubPageReader(page: Page) {
  const verses = [
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
          char_type_name: "end",
          text_uthmani: "١",
          text_qpc_hafs: "١",
          code_v2: "ﱂ",
          page_number: 1,
          line_number: 2,
          v2_page: 1,
          line_v2: 2
        }
      ]
    }
  ];

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
}

test("renders the home page and moves through the main navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "نذاكر بهدوء، ونترك للقرآن مكانًا في قلب الوقت." })).toBeVisible();
  await page.locator("header").getByRole("link", { name: "الإعدادات" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "كل ما يلزم لضبط التجربة الجديدة في مكان واحد." })).toBeVisible();
});

test("opens focus mode and can move into the reader route", async ({ page }) => {
  await installInstantFontMocks(page);
  await mockRubPageReader(page);
  await page.goto("/focus");

  await expect(page.getByText("مؤقت الدراسة")).toBeVisible();
  await expect(page.getByTestId("focus-timer-trigger")).toHaveAttribute("aria-label", "ابدأ جلسة التركيز");
  await page.getByTestId("focus-timer-trigger").click();
  await expect(page.getByText("30:00")).toBeVisible();
  await expect(page.getByTestId("focus-timer-trigger")).toHaveAttribute("aria-label", "أوقف المؤقت");
  await page.getByTestId("focus-timer-trigger").click();
  await expect(page.getByTestId("focus-timer-trigger")).toHaveAttribute("aria-label", "شغّل المؤقت");
  await page.getByTestId("focus-timer-trigger").click();
  await expect(page.getByTestId("focus-timer-trigger")).toHaveAttribute("aria-label", "أوقف المؤقت");
  await page.locator("header nav").getByRole("link", { name: "القراءة", exact: true }).click();
  await expect(page).toHaveURL(/\/reader\/rub$/);
  await expect(page.getByTestId("reader-sound-trigger")).toBeVisible();
});

test("keeps the page reader route and still redirects the removed challenge route", async ({ page }) => {
  await page.goto("/reader/page");
  await expect(page).toHaveURL(/\/reader\/page$/);
  await expect(page.locator("main")).toBeVisible();

  await page.goto("/reader/challenge");
  await expect(page).toHaveURL(/\/reader\/rub$/);
});

test("shows the unavailable backend state clearly inside tafsir", async ({ page }) => {
  await page.route("**/api/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        offline: true,
        rubs: 240,
        pages: 604,
        chapters: 114,
        current_rub: 1,
        backendAvailable: false
      })
    });
  });

  await page.route("**/api/tafsir?**", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        detail: "تعذر الاتصال بالسيرفر المحلي الحالي."
      })
    });
  });

  await page.route("**/api/rub?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rub_number: 1,
        verses: [
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
                char_type_name: "end",
                text_uthmani: "١",
                text_qpc_hafs: "١",
                code_v2: "۝١",
                page_number: 1,
                line_number: 2,
                v2_page: 1,
                line_v2: 2
              }
            ]
          }
        ]
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
            text_uthmani: "بِسْمِ اللَّهِ",
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
                char_type_name: "end",
                text_uthmani: "١",
                text_qpc_hafs: "١",
                code_v2: "۝١",
                page_number: 1,
                line_number: 2,
                v2_page: 1,
                line_v2: 2
              }
            ]
          }
        ]
      })
    });
  });

  await page.goto("/tafsir/1:1");
  await expect(page).toHaveURL(/\/tafsir\//);
  await expect(page.getByText("التفسير يحتاج السيرفر المحلي الحالي، وهو غير متاح الآن.")).toBeVisible();
});

test("tracks stats after both phase transitions and allows resetting them", async ({ page }) => {
  await page.goto("/focus");
  await page.getByTestId("focus-timer-trigger").click();

  await seedTimerState(page, {
    phase: "study",
    isRunning: true,
    remainingSeconds: 0,
    endAt: Date.now() - 10_000,
    lastTransitionAt: null,
    lastCompletedPhase: null,
    transitionSource: null,
    transitionToken: 0
  });

  await page.reload();
  await expect(page).toHaveURL(/\/reader\/rub$/);

  await page.locator("header").getByRole("link", { name: "التركيز" }).click();
  await expect(page).toHaveURL(/\/focus$/);
  await expect(page.getByText("مؤقت الدراسة")).toBeVisible();
  await expect(page.getByText(/^([0-2]\d|30):[0-5]\d$/)).toBeVisible();

  await page.goto("/stats");
  await expect(page.getByTestId("stats-pomodoros-value")).toHaveText("1");
  await expect(page.getByTestId("stats-rubs-value")).toHaveText("1");
  await expect(page.getByTestId("stats-reading-mode-value")).toHaveText("أرباع متتالية");

  await page.getByRole("button", { name: "تصفير الإحصاءات" }).click();
  await expect(page.getByTestId("stats-pomodoros-value")).toHaveText("0");
  await expect(page.getByTestId("stats-rubs-value")).toHaveText("0");
});

test("lets the user control reading positions from settings and applies them to the active reader mode", async ({ page }) => {
  await page.goto("/settings");

  await page.getByTestId("settings-current-rub").fill("7");
  await page.getByRole("button", { name: "حفظ التغييرات" }).click();

  await page.goto("/reader/rub");
  await expect(page.getByTestId("reader-active-chip")).toHaveText("البداية من الربع 7");
});

test("renders the rub reader with the same floating controls used by page mode", async ({ page }) => {
  await installInstantFontMocks(page);
  await mockRubPageReader(page);
  await page.goto("/reader/rub");

  await expect(page.getByTestId("reader-page-stage")).toBeVisible();
  await expect(page.getByTestId("reader-sound-trigger")).toBeVisible();
  await expect(page.locator('a[href="/reader/page"]').first()).toBeVisible();
});

test("uses the unified quran.com-based page renderer without a renderer style selector", async ({ page }) => {
  await installInstantFontMocks(page);
  await mockRubPageReader(page);
  await page.goto("/settings");
  await expect(page.getByText("نمط بناء الصفحة")).toHaveCount(0);

  await page.goto("/reader/page");
  await expect(page.getByTestId("mushaf-page-stage")).toBeVisible();
  await expect(page.getByTestId("mushaf-page-sheet")).toBeVisible();
  await expect(page.getByRole("button", { name: "تكبير الصفحة" })).toBeVisible();

  await page.goto("/reader/rub");
  await expect(page.getByTestId("reader-page-stage")).toBeVisible();
  await expect(page.getByTestId("reader-page-sheet-1")).toBeVisible();
});
