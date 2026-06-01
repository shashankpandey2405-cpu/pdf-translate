"use client";

import { useEffect } from "react";
import { Search, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HeroBackground } from "@/components/home/HeroBackground";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { useCommandPalette } from "@/context/CommandPaletteContext";

export function HomeHero() {
  const { t } = useTranslation();
  const { setOpen } = useCommandPalette();

  useEffect(() => {
    document.documentElement.setAttribute("data-home-hydrated", "true");
  }, []);

  return (
    <section className="relative min-h-[min(88dvh,44rem)] overflow-hidden sm:min-h-[min(92dvh,48rem)]">
      <HeroBackground />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50/90 via-white/70 to-indigo-50/40 dark:from-slate-950/90 dark:via-slate-950/80 dark:to-indigo-950/30"
        aria-hidden
      />

      <div className="saas-section relative flex min-h-[min(88dvh,44rem)] flex-col items-center justify-center px-4 py-14 sm:min-h-[min(92dvh,48rem)] sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
            {t("home.hero.eyebrow", { defaultValue: "Browser privacy · Turbo Cloud · AI" })}
          </p>

          <h1 className="display-h1 mt-5 font-black leading-tight tracking-[-0.02em] text-slate-900 dark:text-white">
            {t("home.hero.titleSharp", {
              defaultValue: "Private on your device. Powerful in the cloud.",
            })}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-indigo-700 dark:text-indigo-300 sm:text-lg">
            {t("home.hero.valueLine", {
              defaultValue:
                "Merge, OCR, translate, compress, and chat with PDFs securely — free in your browser.",
            })}
          </p>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            {t("home.hero.subtitleSharp", {
              defaultValue: "No signup for core tools. Sign in only for Turbo Cloud & AI credits.",
            })}
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <PremiumButton
              href="/merge-pdf"
              className="min-h-[52px] w-full shadow-[0_0_32px_rgb(79,70,229,0.35)] sm:w-auto sm:min-w-[220px]"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Upload className="h-5 w-5" aria-hidden />
                {t("home.hero.uploadCta", { defaultValue: "Upload PDF — start free" })}
              </span>
            </PremiumButton>
            <PremiumButton href="/all-tools" variant="secondary" className="min-h-[52px] w-full sm:w-auto">
              {t("home.hero.ctaAllTools", { defaultValue: "Browse all tools" })}
            </PremiumButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group press-scale mx-auto mt-6 flex min-h-[52px] w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-5 py-3.5 text-left shadow-sm backdrop-blur-md transition-colors hover:border-indigo-400/50 dark:border-slate-700/50 dark:bg-slate-900/70"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Search className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground sm:text-base">
                {t("home.hero.searchPlaceholder", { defaultValue: "Search tools — merge, compress, AI chat…" })}
              </span>
              <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                {t("home.hero.searchHint", { defaultValue: "Tap to search · Keyboard opens instantly" })}
              </span>
            </span>
            <kbd className="hidden rounded-lg border border-border bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground sm:inline">
              ⌘K
            </kbd>
          </button>

          <p className="mt-6 hidden text-center text-sm text-slate-600 dark:text-slate-400 lg:block">
            <a href="/pricing" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              {t("home.hero.ctaPremium", { defaultValue: "View plans" })}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
