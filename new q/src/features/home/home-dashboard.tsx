"use client";

export function HomeDashboard() {
  return (
    <section className="flex flex-1 items-center justify-center py-8 sm:py-12">
      <div className="glass-panel relative w-full max-w-4xl overflow-hidden rounded-[2.75rem] px-6 py-12 text-center shadow-hush sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_72%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_right,rgba(190,161,90,0.12),transparent_70%)]" />

        <div className="relative mx-auto max-w-3xl space-y-6">
          <span className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            ورد
          </span>

          <h1 className="text-3xl font-semibold leading-[1.4] tracking-tight text-ink sm:text-5xl sm:leading-[1.3]">
            نذاكر بهدوء، ونترك للقرآن مكانًا في قلب الوقت.
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-9 text-muted sm:text-[1.35rem] sm:leading-10">
            فكرة المشروع بسيطة وهادئة: نحن نكمل يومنا بشكل طبيعي، ننجز، نراجع، ونجلس للمذاكرة، لكن نضع في هذا الوقت وردًا من القرآن
            في المنتصف، ليبقى القلب حاضرًا، ويبارك الله هذه الساعات.
          </p>

          <p className="mx-auto max-w-xl text-base leading-8 text-muted/90 sm:text-lg">
            ليس تطبيقًا مزدحمًا، ولا تجربة معقدة، بل مساحة خفيفة تجعل التركيز والقرآن يسيران معًا دون ضجيج.
          </p>
        </div>
      </div>
    </section>
  );
}
