"use client";

import type { AppSettings } from "@/lib/types/app";
import type {
  AppStatusPayload,
  OfflineQuranData,
  PageRecitationPayload,
  PageWordTimingsPayload,
  PaginatedVersesResponse,
  QuranVerse,
  RecitationsPayload,
  RubRecitationPayload,
  RubResponse,
  RubWordTimingsPayload,
  TafsirEnhancePayload,
  TafsirPayload,
  VerseAudioResponse
} from "@/lib/types/quran";
import { clampInt } from "@/lib/utils/normalizers";
import { buildVisibleVerseKeysByPage, getDistinctQcfPageNumbers } from "@/lib/utils/mushaf-layout";

let cachedStatus: AppStatusPayload | null = null;
let cachedOfflineData: OfflineQuranData | null = null;

async function parseJsonResponse<T>(response: Response) {
  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) detail = payload.detail;
    } catch {
      // Ignore JSON parse failures for error messages.
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

function buildOfflineRubPayload(data: OfflineQuranData, startRub: number, count: number) {
  const verses: QuranVerse[] = [];
  let currentRub = startRub;

  for (let index = 0; index < count; index += 1) {
    verses.push(...(data.rubs[String(currentRub)] ?? []));
    currentRub = currentRub >= 240 ? 1 : currentRub + 1;
  }

  const endRub = ((startRub - 1 + count - 1) % 240) + 1;
  const visibleVerseKeysByPage = buildVisibleVerseKeysByPage(verses);
  const pageSources = getDistinctQcfPageNumbers(verses).map((pageNumber) => ({
    page_number: pageNumber,
    visible_verse_keys: [...(visibleVerseKeysByPage.get(pageNumber) ?? new Set<string>())],
    verses: data.pages[String(pageNumber)] ?? []
  }));
  return {
    rub_number: count > 1 ? `${startRub} - ${endRub}` : startRub,
    verses,
    page_sources: pageSources
  };
}

export async function fetchAppStatus() {
  const response = await fetch("/api/status", { cache: "no-store" });
  const payload = await parseJsonResponse<AppStatusPayload>(response);
  cachedStatus = payload;
  return payload;
}

export async function hasBackend() {
  if (cachedStatus?.backendAvailable !== undefined) {
    return cachedStatus.backendAvailable;
  }
  const status = await fetchAppStatus();
  return Boolean(status.backendAvailable);
}

export async function fetchOfflineQuranData() {
  if (cachedOfflineData) return cachedOfflineData;
  const response = await fetch("/api/offline-quran", { cache: "force-cache" });
  cachedOfflineData = await parseJsonResponse<OfflineQuranData>(response);
  return cachedOfflineData;
}

export async function fetchRubContent(currentRub: number, count: number) {
  try {
    if (await hasBackend()) {
      await setRubPosition(currentRub);
      const response = await fetch(`/api/rub?count=${clampInt(count, 1, 8, 1)}`, { cache: "no-store" });
      return await parseJsonResponse<RubResponse>(response);
    }

    const data = await fetchOfflineQuranData();
    return buildOfflineRubPayload(data, clampInt(currentRub, 1, 240, 1), clampInt(count, 1, 8, 1));
  } catch {
    const data = await fetchOfflineQuranData();
    return buildOfflineRubPayload(data, clampInt(currentRub, 1, 240, 1), clampInt(count, 1, 8, 1));
  }
}

export async function setRubPosition(nextRub: number) {
  const response = await fetch("/api/set_rub", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ rub_number: clampInt(nextRub, 1, 240, 1) })
  });
  return parseJsonResponse<{ message: string; current_rub: number }>(response);
}

export async function fetchSurahChallengeContent(chapter: number, page: number, perPage: number) {
  try {
    if (await hasBackend()) {
      const response = await fetch(
        `/api/surah_challenge?chapter=${clampInt(chapter, 1, 114, 18)}&page=${clampInt(page, 1, 9999, 1)}&per_page=${clampInt(perPage, 1, 200, 15)}`,
        { cache: "no-store" }
      );
      return await parseJsonResponse<PaginatedVersesResponse>(response);
    }

    const data = await fetchOfflineQuranData();
    const verses = data.chapters[String(clampInt(chapter, 1, 114, 18))] ?? [];
    const safePage = clampInt(page, 1, 9999, 1);
    const safePerPage = clampInt(perPage, 1, 200, 15);
    const start = (safePage - 1) * safePerPage;
    const end = start + safePerPage;
    return {
      verses: verses.slice(start, end),
      pagination: {
        current_page: safePage,
        next_page: end < verses.length ? safePage + 1 : null,
        total_records: verses.length
      }
    };
  } catch {
    const data = await fetchOfflineQuranData();
    const verses = data.chapters[String(clampInt(chapter, 1, 114, 18))] ?? [];
    const safePage = clampInt(page, 1, 9999, 1);
    const safePerPage = clampInt(perPage, 1, 200, 15);
    const start = (safePage - 1) * safePerPage;
    const end = start + safePerPage;
    return {
      verses: verses.slice(start, end),
      pagination: {
        current_page: safePage,
        next_page: end < verses.length ? safePage + 1 : null,
        total_records: verses.length
      }
    };
  }
}

export async function fetchPageContent(pageNumber: number) {
  try {
    if (await hasBackend()) {
      const response = await fetch(`/api/page?page=${clampInt(pageNumber, 1, 604, 1)}`, { cache: "no-store" });
      return await parseJsonResponse<PaginatedVersesResponse>(response);
    }

    const data = await fetchOfflineQuranData();
    return {
      verses: data.pages[String(clampInt(pageNumber, 1, 604, 1))] ?? []
    };
  } catch {
    const data = await fetchOfflineQuranData();
    return {
      verses: data.pages[String(clampInt(pageNumber, 1, 604, 1))] ?? []
    };
  }
}

export async function fetchTafsir(verseKey: string, settings: AppSettings) {
  const response = await fetch(
    `/api/tafsir?verse_key=${encodeURIComponent(verseKey)}&tafsir_id=${settings.tafsirId}`,
    { cache: "no-store" }
  );
  return parseJsonResponse<TafsirPayload>(response);
}

export async function enhanceTafsir(text: string, settings: AppSettings) {
  const response = await fetch("/api/tafsir_enhance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      provider: settings.tafsirEnhanceProvider
    })
  });
  return parseJsonResponse<TafsirEnhancePayload>(response);
}

export async function fetchVerseAudio(verseKey: string, settings: AppSettings) {
  const response = await fetch(
    `/api/verse_audio?verse_key=${encodeURIComponent(verseKey)}&recitation_id=${settings.recitationId}`,
    { cache: "no-store" }
  );
  return parseJsonResponse<VerseAudioResponse>(response);
}

export async function fetchRecitations() {
  const response = await fetch("/api/recitations", { cache: "no-store" });
  return parseJsonResponse<RecitationsPayload>(response);
}

export async function fetchRubRecitation(rubNumber: number, count: number, settings: AppSettings) {
  const response = await fetch(
    `/api/rub_recitation?rub_number=${clampInt(rubNumber, 1, 240, 1)}&count=${clampInt(count, 1, 8, 1)}&recitation_id=${settings.recitationId}`,
    { cache: "no-store" }
  );
  return parseJsonResponse<RubRecitationPayload>(response);
}

export async function fetchPageRecitation(pageNumber: number, settings: AppSettings) {
  const response = await fetch(
    `/api/page_recitation?page_number=${clampInt(pageNumber, 1, 604, 1)}&recitation_id=${settings.recitationId}`,
    { cache: "no-store" }
  );
  return parseJsonResponse<PageRecitationPayload>(response);
}

export async function fetchRubWordTimings(rubNumber: number, count: number, settings: AppSettings) {
  const response = await fetch(
    `/api/rub_word_timings?rub_number=${clampInt(rubNumber, 1, 240, 1)}&count=${clampInt(count, 1, 8, 1)}&recitation_id=${settings.recitationId}`,
    { cache: "no-store" }
  );
  return parseJsonResponse<RubWordTimingsPayload>(response);
}

export async function fetchPageWordTimings(pageNumber: number, settings: AppSettings) {
  const response = await fetch(
    `/api/page_word_timings?page_number=${clampInt(pageNumber, 1, 604, 1)}&recitation_id=${settings.recitationId}`,
    { cache: "no-store" }
  );
  return parseJsonResponse<PageWordTimingsPayload>(response);
}

export async function loadVerseSequence() {
  const data = await fetchOfflineQuranData();
  return Object.values(data.pages ?? {})
    .flat()
    .map((verse) => String(verse.verse_key ?? "").trim())
    .filter(Boolean);
}

export function buildVerseMap(verses: QuranVerse[]) {
  return new Map(verses.map((verse) => [verse.verse_key, verse]));
}
