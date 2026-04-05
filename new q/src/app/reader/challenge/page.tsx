import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "تحويل مسار القراءة",
  description: "مسار تحويل داخلي ضمن تطبيق Quranic Pomodoro.",
  pathname: "/reader/challenge",
  index: false
});

export default function ChallengeReaderPage() {
  permanentRedirect("/reader/rub");
}
