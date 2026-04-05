import type { Metadata } from "next";

import { SURAH_NAMES } from "@/lib/constants/app";

const FALLBACK_SITE_URL = "http://127.0.0.1:3000";

export const SITE_NAME = "Quranic Pomodoro";
export const SITE_DESCRIPTION =
  "تطبيق عربي يدمج جلسات التركيز مع قراءة القرآن الكريم وتفسير الآيات في تجربة هادئة وسريعة.";
export const SITE_KEYWORDS = [
  "Quranic Pomodoro",
  "القرآن الكريم",
  "تطبيق قرآن",
  "تفسير القرآن",
  "مؤقت بومودورو",
  "Pomodoro",
  "Quran reader",
  "Tafsir"
] as const;

export const SITE_URL = resolveSiteUrl();

export interface BuildPageMetadataOptions {
  title: string;
  description: string;
  pathname: string;
  index?: boolean;
  keywords?: readonly string[];
}

export function buildPageMetadata({
  title,
  description,
  pathname,
  index = true,
  keywords = []
}: BuildPageMetadataOptions): Metadata {
  const canonicalPath = normalizePath(pathname);

  return {
    title,
    description,
    keywords: [...SITE_KEYWORDS, ...keywords],
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalPath
    },
    twitter: {
      card: "summary",
      title,
      description
    },
    robots: buildRobotsConfig(index)
  };
}

export function buildTafsirVerseMetadata(verseKey: string): Metadata {
  const parsed = parseVerseKey(verseKey);

  if (!parsed) {
    return buildPageMetadata({
      title: "تفسير القرآن الكريم",
      description: "اقرأ تفسير الآيات مباشرة مع عرض النص القرآني داخل تطبيق Quranic Pomodoro.",
      pathname: "/tafsir/1%3A1",
      keywords: ["تفسير", "تدبر القرآن"]
    });
  }

  const normalizedVerseKey = `${parsed.chapter}:${parsed.verse}`;
  const chapterName = SURAH_NAMES[parsed.chapter - 1];
  const verseLabel = chapterName
    ? `سورة ${chapterName} - آية ${parsed.verse}`
    : `الآية ${normalizedVerseKey}`;

  return buildPageMetadata({
    title: `تفسير ${verseLabel}`,
    description: `تصفح تفسير ${verseLabel} مع عرض الآية وخيارات قراءة مريحة داخل Quranic Pomodoro.`,
    pathname: `/tafsir/${encodeURIComponent(normalizedVerseKey)}`,
    keywords: [
      "تفسير",
      chapterName ? `تفسير سورة ${chapterName}` : "تفسير القرآن",
      `تفسير آية ${parsed.verse}`
    ].filter(Boolean)
  });
}

export function buildAbsoluteUrl(pathname = "/"): string {
  const normalizedPath = normalizePath(pathname);
  return normalizedPath === "/" ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}

export function normalizeVerseKey(verseKey: string): string | null {
  const parsed = parseVerseKey(verseKey);
  return parsed ? `${parsed.chapter}:${parsed.verse}` : null;
}

export function compareVerseKeys(first: string, second: string): number {
  const firstParsed = parseVerseKey(first);
  const secondParsed = parseVerseKey(second);

  if (!firstParsed && !secondParsed) {
    return first.localeCompare(second);
  }

  if (!firstParsed) {
    return 1;
  }

  if (!secondParsed) {
    return -1;
  }

  if (firstParsed.chapter !== secondParsed.chapter) {
    return firstParsed.chapter - secondParsed.chapter;
  }

  return firstParsed.verse - secondParsed.verse;
}

function parseVerseKey(verseKey: string): { chapter: number; verse: number } | null {
  const [chapterRaw, verseRaw] = verseKey.split(":");
  const chapter = Number.parseInt(chapterRaw, 10);
  const verse = Number.parseInt(verseRaw, 10);

  if (
    !Number.isInteger(chapter) ||
    !Number.isInteger(verse) ||
    chapter < 1 ||
    chapter > 114 ||
    verse < 1
  ) {
    return null;
  }

  return { chapter, verse };
}

function resolveSiteUrl() {
  const preferredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || process.env.WEBSITE_HOSTNAME?.trim();

  if (!preferredUrl) {
    return FALLBACK_SITE_URL;
  }

  const hasProtocol = preferredUrl.startsWith("http://") || preferredUrl.startsWith("https://");
  const candidate = hasProtocol ? preferredUrl : `https://${preferredUrl}`;

  try {
    const resolved = new URL(candidate);

    if (resolved.hostname === "localhost" || resolved.hostname === "127.0.0.1") {
      resolved.protocol = "http:";
    }

    resolved.hash = "";
    resolved.search = "";

    return resolved.toString().replace(/\/$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    const absolute = new URL(pathname);
    return absolute.pathname + absolute.search;
  }

  const prefixed = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return prefixed.replace(/\/+$|(?<=.)\/$/, "");
}

function buildRobotsConfig(index: boolean): Metadata["robots"] {
  if (index) {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1
      }
    };
  }

  return {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-image-preview": "none",
      "max-video-preview": 0,
      "max-snippet": 0
    }
  };
}
