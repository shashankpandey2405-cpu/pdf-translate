"use client";

import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HOME_POPULAR_SLUGS } from "../../../constants/homePopularSlugs";
import { findToolBySlug, getToolHref } from "../../../constants/tools";
import { PremiumToolCard } from "@/components/home/PremiumToolCard";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { SaasSection } from "@/components/saas/SaasSection";
import { cn } from "@/lib/utils";

export function HomePopularTools() {
  const { t } = useTranslation();
  const slugs = HOME_POPULAR_SLUGS.slice(0, 16);

  return (
    <SaasSection id="popular-tools" className="py-12 sm:py-20">
      <ScrollReveal>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              {t("home.popular.eyebrow", { defaultValue: "Popular" })}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("home.popular.title", { defaultValue: "Popular tools" })}
            </h2>
            <p className="mt-2 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:block">
              {t("home.popular.subtitle", {
                defaultValue: "One tap to merge, compress, convert, or chat with your PDF.",
              })}
            </p>
          </div>
          <Link
            href="/all-tools"
            aria-label={t("home.popular.browseAll", { defaultValue: "Browse all tools" })}
            className="press-scale inline-flex min-h-[48px] items-center gap-1 self-start rounded-2xl border border-indigo-400/30 bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-600 backdrop-blur-md hover:bg-indigo-500/10 dark:bg-slate-900/70 dark:text-indigo-400"
          >
            {t("home.popular.browseAll", { defaultValue: "All tools" })}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 px-1 sm:gap-5 lg:grid-cols-4 lg:gap-5">
          {slugs.map((slug, index) => {
            const tool = findToolBySlug(slug, t);
            if (!tool) return null;
            const label = t(`tools.${slug}.label`, { defaultValue: tool.label });
            const highlight = t(`home.popular.highlights.${slug}`, { defaultValue: tool.desc });
            const aiHighlight = slug === "chat-pdf" || slug === "ai-summarize";
            return (
              <div
                key={slug}
                className={cn(
                  index >= 6 && "hidden sm:block",
                  index >= 8 && "hidden lg:block",
                  index >= 12 && "hidden xl:block",
                )}
              >
                <PremiumToolCard
                  slug={slug}
                  label={label}
                  description={highlight}
                  href={getToolHref(tool)}
                  index={index}
                  featured={index < 2}
                  aiHighlight={aiHighlight}
                />
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </SaasSection>
  );
}
