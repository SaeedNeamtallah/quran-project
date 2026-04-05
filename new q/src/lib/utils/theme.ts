import type { ThemeName } from "@/lib/types/app";

const THEME_CLASS_NAMES = ["theme-mint", "theme-dark", "theme-black", "theme-lavender", "theme-sky", "theme-rose", "theme-sand"];

export function applyThemeAttributes(theme: ThemeName) {
  if (typeof document === "undefined") return;

  document.body.dataset.theme = theme;
  document.body.classList.remove(...THEME_CLASS_NAMES);
  document.body.classList.add(`theme-${theme}`);
}
