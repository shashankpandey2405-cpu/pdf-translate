"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { HOME_AI_SLUGS } from "../../../constants/homePopularSlugs";
import { findToolBySlug, getToolHref } from "../../../constants/tools";
import { PremiumToolCard } from "@/components/home/PremiumToolCard";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { SaasSection } from "@/components/saas/SaasSection";

export function HomeAiTools() {
  const { t } = useTranslation();

  return (
    <SaasSection id="ai-tools" className="py-12 sm:py-20">
      <ScrollReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden />
              {t("home.ai.eyebrow", { defaultValue: "AI-powered" })}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("home.ai.title", { defaultValue: "AI PDF tools" })}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {t("home.ai.subtitle", {
                defaultValue: "Chat, summarize, and translate — with clear limits and automatic cleanup.",
              })}
            </p>
          </div>
          <Link
            href="/pricing"
            aria-label={t("home.ai.viewPlans", { defaultValue: "View plans and limits" })}
            className="press-scale inline-flex min-h-[48px] shrink-0 items-center gap-1 rounded-2xl border border-indigo-400/30 bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-600 backdrop-blur-md hover:bg-indigo-500/10 dark:bg-slate-900/70 dark:text-indigo-400"
          >
            {t("home.ai.viewPlans", { defaultValue: "View plans" })}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {HOME_AI_SLUGS.map((slug, index) => {
            const tool = findToolBySlug(slug, t);
            if (!tool) return null;
            const href = getToolHref(tool);
            const label = t(`tools.${slug}.label`, { defaultValue: tool.label });
            const highlight = t(`home.ai.highlights.${slug}`, { defaultValue: tool.desc });
            return (
              <PremiumToolCard
                key={slug}
                slug={slug}
                label={label}
                description={highlight}
                href={href}
                index={index + 2}
                featured={index === 0}
                className={index === 0 ? "col-span-2 lg:col-span-2 min-h-[120px]" : undefined}
              />
            );
          })}
        </div>
      </ScrollReveal>
    </SaasSection>
  );
}
