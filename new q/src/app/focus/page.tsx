import type { Metadata } from "next";

import { FocusWorkspace } from "@/features/focus/focus-workspace";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "مؤقت التركيز بالقرآن",
  description: "ابدأ جلسة تركيز بنظام Pomodoro ثم انتقل مباشرة إلى تلاوة القرآن في نفس الواجهة.",
  pathname: "/focus",
  keywords: ["تركيز", "إنتاجية", "Pomodoro عربي"]
});

export default function FocusPage() {
  return <FocusWorkspace />;
}
