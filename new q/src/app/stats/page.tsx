import type { Metadata } from "next";

import { StatsPage } from "@/features/stats/stats-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "إحصائياتك",
  description: "إحصائيات شخصية لمتابعة جلسات التركيز والقراءة داخل التطبيق.",
  pathname: "/stats",
  index: false
});

export default function StatsRoutePage() {
  return <StatsPage />;
}
