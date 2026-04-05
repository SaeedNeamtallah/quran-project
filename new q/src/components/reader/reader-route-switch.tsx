"use client";

import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import type { ReaderRoute } from "@/lib/types/app";

const ROUTES: Array<{ href: ReaderRoute; label: string; compactLabel: string }> = [
  { href: "/reader/rub", label: "الأرباع", compactLabel: "ربع" },
  { href: "/reader/page", label: "صفحة المصحف", compactLabel: "صفحة" }
];

export function ReaderRouteSwitch({
  activeRoute,
  compact = false,
  className
}: {
  activeRoute: ReaderRoute;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center rounded-full border border-line/80 bg-surface/75 shadow-halo",
        compact ? "gap-1 p-0.5" : "gap-2 p-1",
        className
      )}
    >
      {ROUTES.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            compact
              ? "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold leading-none transition"
              : "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeRoute === route.href ? "bg-ink text-white" : "text-muted hover:bg-ink/5 hover:text-ink"
          )}
          title={route.label}
          aria-label={route.label}
        >
          {compact ? route.compactLabel : route.label}
        </Link>
      ))}
    </div>
  );
}
