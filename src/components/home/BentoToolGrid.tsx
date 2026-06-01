"use client";

import { useEffect, useState, memo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  HOME_TOOL_CATEGORIES,
  HOME_TOOL_LABEL_OVERRIDES,
  HOME_BENTO_SIZES,
} from "../../../constants/homeToolGrid";
import { findToolBySlug, getToolHref } from "../../../constants/tools";
import { PremiumToolCard } from "@/components/home/PremiumToolCard";
import { CategoryPanel } from "./CategoryPanel";
import { HomeCategoryChips } from "./HomeCategoryChips";
import { ToolTierBadge } from "@/components/processing/ToolTierBadge";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { staggerItem } from "@/components/premium/motion";
import { cn } from "@/lib/utils";

type BentoSize = "large" | "wide" | "tall" | "default";

function bentoClass(size: BentoSize): string {
  switch (size) {
    case "large":
      return "col-span-2 row-span-2 sm:min-h-[220px]";
    case "wide":
      return "col-span-2 sm:col-span-2";
    case "tall":
      return "row-span-2 sm:min-h-[200px]";
    default:
      return "";
  }
}

const BentoCard = memo(function BentoCard({
  slug,
  label,
  desc,
  href,
  bentoSize,
  index,
}: {
  slug: string;
  label: string;
  desc: string;
  href: string;
  bentoSize: BentoSize;
  index: number;
}) {
  const { t } = useTranslation();
  const featured = bentoSize !== "default";

  return (
    <motion.div variants={staggerItem} className={bentoClass(bentoSize)}>
      <div className="relative h-full">
        <div className="absolute top-3 right-3 z-10">
          <ToolTierBadge slug={slug} />
        </div>
        <PremiumToolCard
          slug={slug}
          label={label}
          description={desc}
          href={href}
          index={index}
          featured={featured}
          className={cn("h-full", featured && "min-h-[180px]")}
        />
        <p className="pointer-events-none absolute bottom-3 left-4 text-[10px] font-medium text-muted-foreground/80">
          {t("premium.toolCard.tags")}
        </p>
      </div>
    </motion.div>
  );
});

export function BentoToolGrid() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState("all");

  useEffect(() => {
    if (activeId === "all") return;
    const el = document.getElementById(`home-cat-${activeId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId]);

  const categoryTitle = (key: string, fallback: string) => {
    const map: Record<string, string> = {
      editOptimize: "home.categories.editOptimize",
      convertToPdf: "home.categories.convertToPdf",
      convertFromPdf: "home.categories.convertFromPdf",
      securitySign: "home.categories.securitySign",
      studentEssentials: "home.categories.studentEssentials",
    };
    return t(map[key] ?? fallback, { defaultValue: fallback });
  };

  const visibleCategories =
    activeId === "all"
      ? HOME_TOOL_CATEGORIES
      : HOME_TOOL_CATEGORIES.filter((c) => c.key === activeId);

  return (
    <ScrollReveal>
      <motion.div className="saas-section space-y-8 min-w-0 py-12 sm:py-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("home.allTools.title", { defaultValue: "All tools" })}
            </h2>
            <p className="mt-2 hidden text-sm text-muted-foreground sm:block">
              {t("home.allTools.subtitle", { defaultValue: "Browse by category — large tap targets on mobile." })}
            </p>
          </div>
          <Link
            href="/all-tools"
            aria-label={t("home.popular.browseAll", { defaultValue: "Browse all tools" })}
            className="press-scale inline-flex min-h-[48px] items-center gap-1 self-start text-sm font-semibold text-indigo-600 dark:text-indigo-400"
          >
            {t("premium.toolCard.open", { defaultValue: "Open" })} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <HomeCategoryChips activeId={activeId} onSelect={setActiveId} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-14 min-w-0"
          >
            {visibleCategories.map((cat) => (
              <CategoryPanel
                key={cat.key}
                id={`home-cat-${cat.key}`}
                title={categoryTitle(cat.key, cat.title)}
                featured={cat.featured}
                subtitle={
                  cat.featured ? (
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      {t("premium.home.featuredSubtitle")}
                    </span>
                  ) : undefined
                }
              >
                <div
                  className={
                    cat.key === "securitySign"
                      ? "grid grid-cols-2 gap-4 px-1 sm:grid-cols-3 sm:gap-4"
                      : "grid grid-cols-2 gap-4 px-1 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 auto-rows-fr"
                  }
                >
                  {cat.slugs.map((slug, index) => {
                    const tool = findToolBySlug(slug, t);
                    if (!tool) return null;
                    const label =
                      slug in HOME_TOOL_LABEL_OVERRIDES
                        ? HOME_TOOL_LABEL_OVERRIDES[slug as keyof typeof HOME_TOOL_LABEL_OVERRIDES]
                        : tool.label;
                    const bentoSize = (HOME_BENTO_SIZES[slug as keyof typeof HOME_BENTO_SIZES] ?? "default") as BentoSize;
                    return (
                      <BentoCard
                        key={slug}
                        slug={slug}
                        label={label}
                        desc={tool.desc}
                        href={getToolHref(tool)}
                        bentoSize={bentoSize}
                        index={index}
                      />
                    );
                  })}
                </div>
              </CategoryPanel>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </ScrollReveal>
  );
}
