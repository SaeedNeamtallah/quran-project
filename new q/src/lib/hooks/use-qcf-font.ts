"use client";

import { useEffect, useMemo, useState } from "react";

import { getFontFaceNameForPage, getQCFFontFaceSource, DEFAULT_QURAN_FONT } from "@/lib/utils/font-face-helper";

const loadedFontFamilies = new Set<string>();

export function useQcfFont(pageNumber: number, enabled: boolean) {
  const fontFamily = useMemo(() => getFontFaceNameForPage(DEFAULT_QURAN_FONT, pageNumber), [pageNumber]);
  const [fontReady, setFontReady] = useState(() => enabled && loadedFontFamilies.has(fontFamily));

  useEffect(() => {
    setFontReady(enabled && loadedFontFamilies.has(fontFamily));

    if (!enabled) {
      return;
    }

    if (loadedFontFamilies.has(fontFamily)) {
      setFontReady(true);
      return;
    }

    let cancelled = false;

    async function loadFont() {
      try {
        const existingFace = [...document.fonts].find((font) => font.family === fontFamily);
        if (existingFace?.status === "loaded") {
          loadedFontFamilies.add(fontFamily);
          if (!cancelled) {
            setFontReady(true);
          }
          return;
        }

        const loadedFace = await new FontFace(fontFamily, getQCFFontFaceSource(DEFAULT_QURAN_FONT, pageNumber)).load();
        if (cancelled) return;

        if (![...document.fonts].some((font) => font.family === loadedFace.family)) {
          document.fonts.add(loadedFace);
        }

        await document.fonts.load(`32px "${fontFamily}"`, "ﱁ");
        await document.fonts.ready;
        loadedFontFamilies.add(fontFamily);

        if (!cancelled) {
          setFontReady(true);
        }
      } catch {
        if (!cancelled) {
          setFontReady(false);
        }
      }
    }

    void loadFont();

    return () => {
      cancelled = true;
    };
  }, [enabled, fontFamily, pageNumber]);

  return {
    fontFamily,
    fontReady
  };
}
