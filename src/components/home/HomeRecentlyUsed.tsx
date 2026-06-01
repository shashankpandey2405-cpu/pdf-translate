"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { findToolBySlug, getToolGroups, getToolHref } from "../../../constants/tools";
import { isToolLive } from "../../../constants/toolStatus";
import { getRecentToolSlugs, pruneRecentToolSlugs } from "@/lib/recentTools";
import { PremiumToolCard } from "@/components/home/PremiumToolCard";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { SaasSection } from "@/components/saas/SaasSection";

export function HomeRecentlyUsed() {
  const { t } = useTranslation();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const validSlugs = useMemo(() => {
    const groups = getToolGroups(t);
    return new Set(
      groups.flatMap((g) => g.items.map((i) => i.slug)).filter((slug) => isToolLive(slug)),
    );
  }, [t]);

  useEffect(() => {
    pruneRecentToolSlugs(validSlugs);
    setSlugs(getRecentToolSlugs(3).filter((s) => validSlugs.has(s)));
    setReady(true);
  }, [validSlugs]);

  if (!ready) {
    return (
      <SaasSection id="recent-tools" className="py-10 sm:py-16">
        <div className="min-h-[140px] w-full animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/50" aria-hidden />
      </SaasSection>
    );
  }

  if (slugs.length === 0) return null;

  return (
    <SaasSection id="recent-tools" className="py-10 sm:py-16">
      <ScrollReveal>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {t("home.recent.title", { defaultValue: "Recently used" })}
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("home.recent.subtitle", { defaultValue: "Pick up where you left off." })}
        </p>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2 scroll-touch snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]">
          {slugs.map((slug, index) => {
            const tool = findToolBySlug(slug, t);
            if (!tool) return null;
            const label = t(`tools.${slug}.label`, { defaultValue: tool.label });
            return (
              <div key={slug} className="w-[min(72vw,220px)] shrink-0 snap-start">
                <PremiumToolCard
                  slug={slug}
                  label={label}
                  description={tool.desc}
                  href={getToolHref(tool)}
                  index={index}
                />
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </SaasSection>
  );
}
