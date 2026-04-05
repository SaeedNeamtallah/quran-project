import type { Metadata } from "next";

import { ReaderWorkspace } from "../../../features/reader/reader-workspace";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "قراءة القرآن بالرُّبع",
  description: "اقرأ القرآن بوضع الأرباع مع تشغيل التلاوة وتتبع الكلمات داخل تجربة مركزة وسريعة.",
  pathname: "/reader/rub",
  keywords: ["قراءة القرآن", "الأرباع", "تلاوة"]
});

export default function RubReaderPage() {
  return <ReaderWorkspace />;
}
