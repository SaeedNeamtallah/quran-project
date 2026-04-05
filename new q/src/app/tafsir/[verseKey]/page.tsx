import type { Metadata } from "next";

import { TafsirWorkspace } from "@/features/tafsir/tafsir-workspace";
import { buildTafsirVerseMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params
}: {
  params: Promise<{ verseKey: string }>;
}): Promise<Metadata> {
  const { verseKey } = await params;
  return buildTafsirVerseMetadata(verseKey);
}

export default async function TafsirPage({
  params
}: {
  params: Promise<{ verseKey: string }>;
}) {
  const { verseKey } = await params;

  return <TafsirWorkspace verseKey={verseKey} />;
}
