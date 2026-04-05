import { expect, test } from "@playwright/test";

function buildTafsirPayload(verseKey: string) {
  if (verseKey === "1:2") {
    return {
      verse_key: "1:2",
      verse_text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
      tafsir: {
        resource_id: 926,
        name: "تفسير تجريبي",
        language_name: "arabic",
        text: "<h2>المعنى العام</h2><p>هذا تفسير الآية الثانية (بتقسيم واضح). الجملة التالية.</p>",
        plain_text: "هذا تفسير الآية الثانية (بتقسيم واضح). الجملة التالية."
      }
    };
  }

  return {
    verse_key: "1:1",
    verse_text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
    tafsir: {
      resource_id: 926,
      name: "تفسير تجريبي",
      language_name: "arabic",
      text: "<h2>مقدمة قصيرة</h2><p>هذا تفسير افتتاحي (واضح). الجملة التالية.</p>",
      plain_text: "هذا تفسير افتتاحي (واضح). الجملة التالية."
    }
  };
}

test("renders structured tafsir blocks, supports enhancement, and navigates between verses", async ({ page }) => {
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

  await page.route("**/api/tafsir?**", async (route) => {
    const url = new URL(route.request().url());
    const verseKey = url.searchParams.get("verse_key") ?? "1:1";

    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(buildTafsirPayload(verseKey))
    });
  });

  await page.route("**/api/tafsir_enhance", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        plain_text: "نص منسق",
        provider: "auto",
        model: "mock-model",
        segments: ["فقرة محسنة أولى.", "فقرة محسنة ثانية."]
      })
    });
  });

  await page.goto("/tafsir/1%3A1");

  await expect(page.getByTestId("tafsir-source-badge")).toHaveText("تفسير تجريبي");
  await expect(page.getByTestId("tafsir-block-heading-0")).toHaveText("مقدمة قصيرة");
  await expect(page.getByTestId("tafsir-block-paragraph-1")).toContainText("هذا تفسير افتتاحي");
  await expect(page.getByTestId("tafsir-prev-button")).toBeDisabled();
  await expect(page.getByTestId("tafsir-next-button")).toBeEnabled();

  await page.getByTestId("tafsir-enhance-button").click();
  await expect(page.getByTestId("tafsir-block-paragraph-0")).toHaveText("فقرة محسنة أولى.");
  await expect(page.getByTestId("tafsir-block-paragraph-1")).toHaveText("فقرة محسنة ثانية.");

  await page.getByTestId("tafsir-next-button").click();
  await expect(page).toHaveURL(/\/tafsir\/1%3A2$/);
  await expect(page.getByTestId("tafsir-block-heading-0")).toHaveText("المعنى العام");

  await page.getByTestId("tafsir-prev-button").click();
  await expect(page).toHaveURL(/\/tafsir\/1%3A1$/);
  await expect(page.getByTestId("tafsir-block-heading-0")).toHaveText("مقدمة قصيرة");
});
