import { promises as fs } from "node:fs";
import path from "node:path";

import type { OfflineQuranData, QuranVerse } from "@/lib/types/quran";

const OFFLINE_PATH = path.resolve(process.cwd(), "..", "quran_offline.json");

let offlinePromise: Promise<OfflineQuranData> | null = null;

export async function readOfflineQuranData() {
  if (!offlinePromise) {
    offlinePromise = fs.readFile(OFFLINE_PATH, "utf8").then((raw) => JSON.parse(raw) as OfflineQuranData);
  }
  return offlinePromise;
}

export async function getOfflineStatus() {
  const data = await readOfflineQuranData();
  return {
    offline: true,
    rubs: Object.keys(data.rubs ?? {}).length,
    pages: Object.keys(data.pages ?? {}).length,
    chapters: Object.keys(data.chapters ?? {}).length,
    current_rub: 1,
    backendAvailable: false
  };
}

export function buildOfflineRubPayload(data: OfflineQuranData, startRub: number, count: number) {
  const verses: QuranVerse[] = [];
  let currentRub = startRub;

  for (let index = 0; index < count; index += 1) {
    verses.push(...(data.rubs[String(currentRub)] ?? []));
    currentRub = currentRub >= 240 ? 1 : currentRub + 1;
  }

  const endRub = ((startRub - 1 + count - 1) % 240) + 1;
  return {
    rub_number: count > 1 ? `${startRub} - ${endRub}` : startRub,
    verses
  };
}
