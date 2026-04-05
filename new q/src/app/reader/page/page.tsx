import type { Metadata } from "next";

import { MushafPageWorkspace } from "../../../features/reader/mushaf-page-workspace";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "قراءة المصحف بالصفحات",
  description: "تصفح صفحات المصحف مع خيارات عرض متعددة وتلاوة صوتية متزامنة للكلمات والآيات.",
  pathname: "/reader/page",
  keywords: ["مصحف", "صفحات المصحف", "Quran reader"]
});

export default function MushafPageReaderPage() {
  return <MushafPageWorkspace />;
}
