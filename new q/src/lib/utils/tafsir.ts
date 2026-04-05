import { splitPlainTextIntoParagraphs } from "@/lib/utils/format";

export interface TafsirBlock {
  type: "heading" | "paragraph";
  text: string;
}

function normalizeWhitespace(value: string) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeTafsirHtml(rawHtml: string) {
  return String(rawHtml ?? "")
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/<h1\b[^>]*>/gi, "<h3>")
    .replace(/<h2\b[^>]*>/gi, "<h3>")
    .replace(/<\/h1>/gi, "</h3>")
    .replace(/<\/h2>/gi, "</h3>")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<p\b[^>]*>\s*<\/p>/gi, "");
}

function buildParagraphBlocks(text: string, sentenceCount: number) {
  return splitPlainTextIntoParagraphs(text, sentenceCount).map((paragraph) => ({
    type: "paragraph" as const,
    text: paragraph
  }));
}

function buildBlocksFromHtml(rawHtml: string, sentenceCount: number) {
  if (typeof DOMParser === "undefined") return [] as TafsirBlock[];

  const parser = new DOMParser();
  const document = parser.parseFromString(`<article>${rawHtml}</article>`, "text/html");
  const root = document.body.firstElementChild;

  if (!root) return [] as TafsirBlock[];

  const blocks: TafsirBlock[] = [];
  root.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li").forEach((element) => {
    const text = normalizeWhitespace(element.textContent ?? "");
    if (!text) return;

    if (/^H[1-6]$/.test(element.tagName)) {
      blocks.push({
        type: "heading",
        text
      });
      return;
    }

    blocks.push(...buildParagraphBlocks(text, sentenceCount));
  });

  if (blocks.length) return blocks;

  const fallbackText = normalizeWhitespace(root.textContent ?? "");
  return fallbackText ? buildParagraphBlocks(fallbackText, sentenceCount) : [];
}

export function buildTafsirBlocks(rawHtml: string, plainText: string, sentenceCount = 7) {
  const normalizedHtml = normalizeTafsirHtml(rawHtml);
  if (normalizedHtml) {
    const htmlBlocks = buildBlocksFromHtml(normalizedHtml, sentenceCount);
    if (htmlBlocks.length) return htmlBlocks;
  }

  const fallbackSource = String(plainText ?? "").trim() || normalizeWhitespace(rawHtml);
  return fallbackSource ? buildParagraphBlocks(fallbackSource, sentenceCount) : [];
}
