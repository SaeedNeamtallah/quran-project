import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OfflineQuranData } from "@/lib/types/quran";

const offlineData: OfflineQuranData = {
  rubs: {
    "1": [
      {
        id: 1,
        verse_number: 1,
        verse_key: "1:1",
        hizb_number: 1,
        rub_el_hizb_number: 1,
        ruku_number: 1,
        manzil_number: 1,
        text_uthmani: "الحمد لله",
        page_number: 1,
        juz_number: 1,
        chapter_id: 1
      }
    ],
    "240": [
      {
        id: 2,
        verse_number: 6,
        verse_key: "114:6",
        hizb_number: 60,
        rub_el_hizb_number: 240,
        ruku_number: 1,
        manzil_number: 7,
        text_uthmani: "من الجنة والناس",
        page_number: 604,
        juz_number: 30,
        chapter_id: 114
      }
    ]
  },
  pages: {
    "1": [
      {
        id: 3,
        verse_number: 1,
        verse_key: "1:1",
        hizb_number: 1,
        rub_el_hizb_number: 1,
        ruku_number: 1,
        manzil_number: 1,
        text_uthmani: "الحمد لله",
        page_number: 1,
        juz_number: 1,
        chapter_id: 1
      }
    ],
    "2": [
      {
        id: 4,
        verse_number: 2,
        verse_key: "1:2",
        hizb_number: 1,
        rub_el_hizb_number: 1,
        ruku_number: 1,
        manzil_number: 1,
        text_uthmani: "رب العالمين",
        page_number: 2,
        juz_number: 1,
        chapter_id: 1
      }
    ]
  },
  chapters: {
    "18": [
      {
        id: 5,
        verse_number: 1,
        verse_key: "18:1",
        hizb_number: 30,
        rub_el_hizb_number: 117,
        ruku_number: 1,
        manzil_number: 4,
        text_uthmani: "الحمد لله الذي أنزل على عبده الكتاب",
        page_number: 293,
        juz_number: 15,
        chapter_id: 18
      },
      {
        id: 6,
        verse_number: 2,
        verse_key: "18:2",
        hizb_number: 30,
        rub_el_hizb_number: 117,
        ruku_number: 1,
        manzil_number: 4,
        text_uthmani: "قيما",
        page_number: 293,
        juz_number: 15,
        chapter_id: 18
      },
      {
        id: 7,
        verse_number: 3,
        verse_key: "18:3",
        hizb_number: 30,
        rub_el_hizb_number: 117,
        ruku_number: 1,
        manzil_number: 4,
        text_uthmani: "ماكثين فيه أبدا",
        page_number: 293,
        juz_number: 15,
        chapter_id: 18
      }
    ]
  }
};

function makeJsonResponse(payload: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  );
}

describe("api client fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("uses offline rub data immediately when the backend is unavailable", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url === "/api/status") {
        return makeJsonResponse({
          offline: true,
          rubs: 240,
          pages: 604,
          chapters: 114,
          current_rub: 1,
          backendAvailable: false
        });
      }
      if (url === "/api/offline-quran") {
        return makeJsonResponse(offlineData);
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { fetchRubContent } = await import("@/lib/api/client");
    const payload = await fetchRubContent(240, 2);

    expect(payload.rub_number).toBe("240 - 1");
    expect(payload.verses.map((verse) => verse.verse_key)).toEqual(["114:6", "1:1"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("loads the verse sequence once and reuses the offline cache", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url === "/api/offline-quran") {
        return makeJsonResponse(offlineData);
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { loadVerseSequence } = await import("@/lib/api/client");
    const first = await loadVerseSequence();
    const second = await loadVerseSequence();

    expect(first).toEqual(["1:1", "1:2"]);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
