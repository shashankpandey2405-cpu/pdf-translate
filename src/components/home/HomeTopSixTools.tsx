"use client";

import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HOME_TOP_SIX_SLUGS } from "../../../constants/homeTopTools";
import { findToolBySlug, getToolHref } from "../../../constants/tools";
import { PremiumToolCard } from "@/components/home/PremiumToolCard";
import { SaasSection } from "@/components/saas/SaasSection";

export function HomeTopSixTools() {
  const { t } = useTranslation();

  return (
    <SaasSection id="top-tools" className="py-10 sm:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {t("home.topSix.eyebrow", { defaultValue: "Start here" })}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("home.topSix.title", { defaultValue: "Top PDF tools" })}
          </h2>
          <p className="mt-2 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {t("home.topSix.subtitle", {
              defaultValue: "Merge, compress, split, convert, OCR, or chat — free in your browser.",
            })}
          </p>
        </div>
        <Link
          href="/all-tools"
          className="press-scale inline-flex min-h-[48px] items-center gap-1 self-start rounded-2xl border border-indigo-400/30 bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-600 backdrop-blur-md hover:bg-indigo-500/10 dark:bg-slate-900/70 dark:text-indigo-400"
        >
          {t("home.topSix.allTools", { defaultValue: "All tools" })}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
        {HOME_TOP_SIX_SLUGS.map((slug, index) => {
          const tool = findToolBySlug(slug, t);
          if (!tool) return null;
          const label = t(`tools.${slug}.label`, { defaultValue: tool.label });
          const highlight = t(`home.topSix.highlights.${slug}`, { defaultValue: tool.desc });
          return (
            <PremiumToolCard
              key={slug}
              slug={slug}
              label={label}
              description={highlight}
              href={getToolHref(tool)}
              index={index}
              featured={index < 2}
              aiHighlight={slug === "chat-pdf" || slug === "ocr-pdf"}
              disableMotion
              accessibleVisibleText
            />
          );
        })}
      </div>
    </SaasSection>
  );
}
