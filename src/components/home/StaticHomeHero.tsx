import { HOME_HERO_DEFAULTS as h } from "@/components/home/homeHeroDefaults";

/** Server-rendered LCP hero — same slot as client `HomeHero` inside Home.tsx. */
export function StaticHomeHero() {
  return (
    <section className="relative min-h-[min(88dvh,44rem)] overflow-hidden sm:min-h-[min(92dvh,48rem)]">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/90 via-white/70 to-indigo-50/40 dark:from-slate-950/90 dark:via-slate-950/80 dark:to-indigo-950/30"
        aria-hidden
      />
      <div className="saas-section relative flex min-h-[min(88dvh,44rem)] flex-col items-center justify-center px-4 py-14 sm:min-h-[min(92dvh,48rem)] sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
            {h.eyebrow}
          </p>
          <h1 className="display-h1 mt-5 font-black leading-tight tracking-[-0.02em] text-slate-900 dark:text-white">
            {h.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-indigo-700 dark:text-indigo-300 sm:text-lg">
            {h.valueLine}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            {h.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
