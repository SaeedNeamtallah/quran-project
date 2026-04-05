"use client";

import { Activity, BookOpenText, RotateCcw, TimerReset } from "lucide-react";

import { getReadingModeLabel } from "@/lib/utils/format";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useStatsStore } from "@/lib/stores/stats-store";

export function StatsPage() {
  const pomodoros = useStatsStore((state) => state.pomodoros);
  const rubs = useStatsStore((state) => state.rubs);
  const pages = useStatsStore((state) => state.pages);
  const resetStats = useStatsStore((state) => state.resetStats);

  return (
    <div className="grid gap-6">
      <section className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8">
        <span className="text-sm font-semibold text-accent">الإحصاءات الشخصية</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">أرقام بسيطة وواضحة بدون ضوضاء dashboard.</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
          الإحصاءات ما زالت محلية في هذه المرحلة، لكنها الآن خارج المودال القديم وفي صفحة يمكن توسيعها لاحقًا لتقارير أكثر فائدة.
        </p>
        <div className="mt-5">
          <button
            type="button"
            onClick={resetStats}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-3 text-sm font-semibold text-ink transition hover:border-accent/30 hover:text-accent"
          >
            <RotateCcw className="h-4 w-4" />
            تصفير الإحصاءات
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="glass-panel rounded-[1.75rem] p-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
            <TimerReset className="h-5 w-5" />
          </div>
          <div className="mt-5 text-4xl font-semibold text-ink" data-testid="stats-pomodoros-value">
            {pomodoros}
          </div>
          <p className="mt-3 text-sm leading-7 text-muted">عدد جلسات الدراسة التي اكتملت وانتقلت بعدها إلى وضع القراءة.</p>
        </article>

        <article className="glass-panel rounded-[1.75rem] p-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
            <BookOpenText className="h-5 w-5" />
          </div>
          <div className="mt-5 text-4xl font-semibold text-ink" data-testid="stats-rubs-value">
            {rubs}
          </div>
          <p className="mt-3 text-sm leading-7 text-muted">عدد الأرباع التي تم احتسابها عند الرجوع من وضع القراءة إلى التركيز.</p>
        </article>

        <article className="glass-panel rounded-[1.75rem] p-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
            <BookOpenText className="h-5 w-5" />
          </div>
          <div className="mt-5 text-4xl font-semibold text-ink" data-testid="stats-pages-value">
            {pages}
          </div>
          <p className="mt-3 text-sm leading-7 text-muted">عدد الصفحات التي تم قراءتها (في وضع تحدي الصفحات).</p>
        </article>
      </section>
    </div>
  );
}
