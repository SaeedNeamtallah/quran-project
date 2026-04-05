import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "تحويل إلى التفسير",
  description: "مسار تحويل لصفحة التفسير داخل تطبيق Quranic Pomodoro.",
  pathname: "/tafsir",
  index: false
});

export default function TafsirRedirectPage() {
  permanentRedirect("/tafsir/1:1");
}
