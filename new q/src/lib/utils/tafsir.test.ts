import { describe, expect, it } from "vitest";

import { buildTafsirBlocks } from "@/lib/utils/tafsir";

describe("tafsir utilities", () => {
  it("preserves heading blocks from structured html tafsir", () => {
    const blocks = buildTafsirBlocks(
      "<h2>مقدمة موجزة</h2><p>هذا تفسير تجريبي (مفيد). الجملة الثانية.</p>",
      "هذا تفسير تجريبي (مفيد). الجملة الثانية."
    );

    expect(blocks).toEqual([
      { type: "heading", text: "مقدمة موجزة" },
      { type: "paragraph", text: "هذا تفسير تجريبي (مفيد). الجملة الثانية." }
    ]);
  });

  it("falls back to plain text paragraphs when the source html is empty", () => {
    const blocks = buildTafsirBlocks("", "الأولى. الثانية. الثالثة.\n\nالرابعة.");

    expect(blocks).toEqual([
      { type: "paragraph", text: "الأولى. الثانية. الثالثة." },
      { type: "paragraph", text: "الرابعة." }
    ]);
  });
});
