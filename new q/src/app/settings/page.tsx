import type { Metadata } from "next";

import { SettingsPage } from "@/features/settings/settings-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "إعدادات التطبيق",
  description: "شاشة إعدادات داخلية لضبط تجربة القراءة والتركيز في Quranic Pomodoro.",
  pathname: "/settings",
  index: false
});

export default function SettingsRoutePage() {
  return <SettingsPage />;
}
