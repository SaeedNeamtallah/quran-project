import { SURAH_NAMES } from "@/lib/constants/app";
import type { ReaderRoute } from "@/lib/types/app";
import type { ReadingMode, SessionPhase } from "@/lib/types/quran";

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatVerseMarker(verseKey: string) {
  const normalized = String(verseKey ?? "").trim();
  if (!normalized.includes(":")) return normalized || "--";
  return normalized.split(":").pop() || normalized;
}

export function getReadingModeLabel(mode: ReadingMode) {
  return mode === "page" ? "صفحة المصحف" : "أرباع متتالية";
}

export function getReaderRouteLabel(route: ReaderRoute) {
  return route === "/reader/page" ? "صفحة المصحف" : "أرباع متتالية";
}

export function getPhaseLabel(phase: SessionPhase) {
  return phase === "study" ? "وقت التركيز" : "استراحة قرآنية";
}

export function getSurahName(chapter: number) {
  return SURAH_NAMES[chapter - 1] ?? `سورة ${chapter}`;
}

export function splitPlainTextIntoParagraphs(text: string, sentenceCount = 7) {
  const normalized = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.flatMap((block) => {
    const parts = block.match(/[^.!؟!?۔]+(?:[.!؟!?۔]+|$)/g) ?? [block];
    const units = parts.map((part) => part.trim()).filter(Boolean);

    if (units.length <= sentenceCount) return [block];

    const chunks: string[] = [];
    for (let index = 0; index < units.length; index += sentenceCount) {
      chunks.push(units.slice(index, index + sentenceCount).join(" ").trim());
    }
    return chunks;
  });
}

export function highlightTafsirText(text: string) {
  const ARABIC_WORD = "[\\u0621-\\u064A\\u064B-\\u065F]+"; // Supports letters + Harakat
  const PERSON_NAME = `(?:${ARABIC_WORD}(?:\\s+${ARABIC_WORD}){0,5})`;
  
  const ISNAD_PATTERNS = [
    // حدثنا فلان عن فلان
    `(?:حدثنا|حدثني|أخبرنا|أخبرني|أنبأنا|أنبأني|سمعت|ذكر|قال|قيل|روي|رُوي|بلغني|بلغنا)\\s+${PERSON_NAME}(?:\\s+(?:قال|عن|أن|أنه)\\s+${PERSON_NAME}){1,6}`,
    // عن فلان عن فلان
    `(?:عن\\s+${PERSON_NAME})(?:\\s+عن\\s+${PERSON_NAME}){1,6}`,
    // عن فلان قال
    `عن\\s+${PERSON_NAME}\\s+قال`,
    // قال فلان
    `(?:قال|وقال|قالوا)\\s+${PERSON_NAME}`
  ].join("|");

  const BRACKET_PATTERN = "\\([^()]*\\)|\\{[^{}]*\\}|\\[[^\\[\\]]*\\]|﴿[^﴿﴾]*﴾|«[^«»]*»|（[^（）]*）|\"(?:[^\"]*)\"|'(?:[^']*)'";
  
  // Combine all patterns into a single capturing group to retain them in .split()
  const COMBINED_REGEX = new RegExp(`(${BRACKET_PATTERN}|${ISNAD_PATTERNS})`, "g");
  const EXACT_BRACKET_REGEX = new RegExp(`^(?:${BRACKET_PATTERN})$`);
  const EXACT_ISNAD_REGEX = new RegExp(`^(?:${ISNAD_PATTERNS})$`);

  return String(text ?? "")
    .split(COMBINED_REGEX)
    .filter(Boolean)
    .map((part, index) => {
      let type: "text" | "bracket" | "isnad" = "text";
      if (EXACT_BRACKET_REGEX.test(part)) type = "bracket";
      else if (EXACT_ISNAD_REGEX.test(part)) type = "isnad";

      return {
        id: `${part}-${index}-${part.slice(0, 5)}`,
        text: part,
        type,
        highlighted: type !== "text"
      };
    });
}

function buildHarakatPattern(phrase: string) {
  return phrase
    .split(" ")
    .map((word) => word.split("").join("[\\u064B-\\u065F]*"))
    .join("\\s+");
}

const ARABIC_PREFIXES = "(?:[وفبل][\\u064B-\\u065F]*)?";

const SACRED_CORE = [
  "اللَّه", "الله", "اللهم", "لله", "إله", "إلهي", 
  "رب", "ربه", "ربها", "ربهم", "ربكم", "ربنا", "ربي", "الرب",
  "رسول", "رسوله", "رسولهم", "رسولكم", "رسولنا", "الرسول",
  "نبي", "نبيه", "نبيها", "نبيهم", "نبيكم", "نبينا", "النبي", "أنبياء", "الأنبياء",
  "محمد", "محمدا", "محمداً", "أحمد",
  "صلى الله عليه وسلم", "صل الله عليه وسلم", "عليه الصلاة والسلام", "عليه السلام", "صلى الله عليه وآله وسلم",
  "رضي الله عنه", "رضي الله عنها", "رضي الله عنهما", "رضي الله عنهم",
  "عز وجل", "جل وعلا", "جل جلاله", "سبحانه وتعالى", "تبارك وتعالى", "تعالى", "سبحانه",
  "رضوان الله عليه", "رحمه الله", "رحمها الله", "رحمهم الله"
];

const SACRED_WORDS_PATTERN = SACRED_CORE.map(w => ARABIC_PREFIXES + buildHarakatPattern(w)).join("|");
const SACRED_REGEX = new RegExp(`(^|[\\s\\.,،؛\\-\\(«﴾\\[\\{])(${SACRED_WORDS_PATTERN})(?=$|[\\s\\.,،؛\\-\\)\\»﴿\\]\\}])`, "g");
const EXACT_SACRED_REGEX = new RegExp(`^(?:${SACRED_WORDS_PATTERN})$`);

export function parseSacredTexts(text: string) {
  return String(text ?? "")
    .split(SACRED_REGEX)
    .filter(Boolean)
    .map((part, index) => {
      return {
        id: `sac-${index}-${part.slice(0, 5)}`,
        text: part,
        isSacred: EXACT_SACRED_REGEX.test(part),
      };
    });
}

