/** Reserved layout for homepage route — matches HomeHero min-height to prevent CLS while chunks load. */
export function HomePageSkeleton() {
  return (
    <div
      className="mesh-gradient min-w-0 overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/60 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20"
      aria-hidden
    >
      <section className="relative min-h-[min(88dvh,44rem)] overflow-hidden sm:min-h-[min(92dvh,48rem)]">
        <div className="saas-section relative flex min-h-[min(88dvh,44rem)] flex-col items-center justify-center px-4 py-14 sm:min-h-[min(92dvh,48rem)] sm:px-6 sm:py-20">
          <div className="mx-auto w-full max-w-3xl space-y-4 text-center">
            <div className="mx-auto h-3 w-40 rounded-full bg-slate-200/80 dark:bg-slate-800" />
            <div className="mx-auto h-12 max-w-2xl rounded-2xl bg-slate-200/70 dark:bg-slate-800/80" />
            <div className="mx-auto h-6 max-w-xl rounded-xl bg-slate-200/60 dark:bg-slate-800/70" />
            <div className="mx-auto mt-8 h-14 max-w-xl rounded-2xl bg-slate-200/50 dark:bg-slate-800/60" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function HomeSectionSkeleton({
  className = "min-h-[240px]",
}: {
  className?: string;
}) {
  return (
    <div
      className={`saas-section mx-auto w-full max-w-7xl rounded-2xl bg-slate-100/80 dark:bg-slate-900/40 ${className}`}
      aria-hidden
    />
  );
}
