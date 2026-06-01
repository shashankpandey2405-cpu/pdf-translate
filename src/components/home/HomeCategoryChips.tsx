"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HOME_TOOL_CATEGORIES } from "../../../constants/homeToolGrid";
import { cn } from "@/lib/utils";

const CATEGORY_I18N: Record<string, string> = {
  editOptimize: "home.categories.editOptimize",
  convertToPdf: "home.categories.convertToPdf",
  convertFromPdf: "home.categories.convertFromPdf",
  securitySign: "home.categories.securitySign",
  studentEssentials: "home.categories.studentEssentials",
};

const QUICK_FILTERS = [
  { key: "all", labelKey: "home.categories.all", defaultLabel: "All" },
  { key: "editOptimize", labelKey: "home.categories.editShort", defaultLabel: "Edit" },
  { key: "convertToPdf", labelKey: "home.categories.convertShort", defaultLabel: "Convert" },
  { key: "convertFromPdf", labelKey: "home.categories.fromPdfShort", defaultLabel: "From PDF" },
  { key: "securitySign", labelKey: "home.categories.securityShort", defaultLabel: "Security" },
] as const;

type Props = {
  activeId?: string;
  onSelect?: (categoryKey: string) => void;
  className?: string;
};

/** Horizontal scrollable category pills — touch-friendly on mobile. */
export function HomeCategoryChips({ activeId, onSelect, className }: Props) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  const pills = [
    ...QUICK_FILTERS.map((f) => ({
      key: f.key,
      label: t(f.labelKey, { defaultValue: f.defaultLabel }),
    })),
    ...HOME_TOOL_CATEGORIES.filter((c) => !QUICK_FILTERS.some((q) => q.key === c.key)).map((cat) => ({
      key: cat.key,
      label: t(CATEGORY_I18N[cat.key] ?? cat.title, { defaultValue: cat.title }),
    })),
  ];

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <button
        type="button"
        aria-label={t("home.categories.scrollPrev", { defaultValue: "Scroll categories left" })}
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200/60 bg-white/90 p-1.5 shadow-sm backdrop-blur-md sm:flex dark:border-slate-700/50 dark:bg-slate-900/90"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t("home.categories.scrollNext", { defaultValue: "Scroll categories right" })}
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200/60 bg-white/90 p-1.5 shadow-sm backdrop-blur-md sm:flex dark:border-slate-700/50 dark:bg-slate-900/90"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>

      <div
        ref={scrollRef}
        className="flex w-full min-w-0 gap-2 overflow-x-auto overflow-y-hidden pb-2 scroll-touch snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch] px-1 sm:px-10"
        role="tablist"
        aria-label={t("home.categories.aria", { defaultValue: "Tool categories" })}
      >
        {pills.map((pill) => {
          const active = activeId === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect?.(pill.key)}
              className={cn(
                "snap-start shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors touch-manipulation min-h-[44px] press-scale",
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "border border-slate-200/60 bg-white/70 text-foreground backdrop-blur-md hover:bg-slate-50 dark:border-slate-700/50 dark:bg-slate-900/70",
              )}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
