"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Gauge, House, Settings2, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";

import { useReaderStore } from "@/lib/stores/reader-store";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/focus", label: "التركيز", icon: TimerReset },
  { href: "/reader/rub", label: "القراءة", icon: BookOpenText },
  { href: "/settings", label: "الإعدادات", icon: Settings2 }
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFocusPage = pathname === "/focus";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lastReaderRoute = useReaderStore((state) => state.lastReaderRoute) || "/reader/rub";

  function isNavItemActive(href: string) {
    if (href === "/reader/rub") {
      return pathname === "/reader/rub" || pathname === "/reader/page" || pathname.startsWith("/reader/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const isReaderPage = pathname.startsWith("/reader/");

  return (
    <div className={cn("relative flex flex-col", isFocusPage ? "h-svh overflow-hidden" : isReaderPage ? "h-svh overflow-hidden" : "min-h-screen")}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[12%] top-12 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-[10%] h-80 w-80 rounded-full bg-mist/80 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 shrink-0 border-b border-line/70 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-2 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center justify-start min-w-0">
            <Link href="/" className="inline-flex items-center gap-2 text-ink">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-[10px] font-bold text-accent">
                ورد
              </span>
              <span className="text-sm font-semibold tracking-tight sm:text-base">Quranic Pomodoro</span>
            </Link>
          </div>

          <nav className="flex shrink-0 items-center justify-center gap-1 sm:gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item.href);
              const Icon = item.icon;
              const targetHref = item.href === "/reader/rub" && mounted ? lastReaderRoute : item.href;
              
              return (
                <Link
                  key={item.href}
                  href={targetHref}
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm",
                    active ? "bg-ink text-white shadow-halo" : "text-muted hover:bg-ink/5 hover:text-ink"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:hidden" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end" aria-hidden="true" />
        </div>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full flex-col",
          isFocusPage
            ? "max-w-7xl flex-1 overflow-hidden px-4 py-3 sm:px-6 sm:py-4 lg:px-8"
            : isReaderPage
              ? "flex-1 overflow-x-auto overflow-y-auto scroll-pt-14 px-0 pb-0 pt-1"
              : "min-h-[calc(100vh-5rem)] max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}
