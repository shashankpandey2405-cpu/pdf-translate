"use client";

import { memo } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/home/ToolIcon";
import { cn } from "@/lib/utils";

const ICON_GRADIENTS = [
  "from-blue-500/15 to-blue-600/25 text-blue-600 dark:text-blue-400",
  "from-indigo-500/15 to-indigo-600/25 text-indigo-600 dark:text-indigo-400",
  "from-violet-500/15 to-violet-600/25 text-violet-600 dark:text-violet-400",
  "from-emerald-500/15 to-emerald-600/25 text-emerald-600 dark:text-emerald-400",
  "from-sky-500/15 to-sky-600/25 text-sky-600 dark:text-sky-400",
  "from-rose-500/15 to-rose-600/25 text-rose-600 dark:text-rose-400",
] as const;

export type PremiumToolCardProps = {
  slug: string;
  label: string;
  description: string;
  href: string;
  index?: number;
  featured?: boolean;
  aiHighlight?: boolean;
  disableMotion?: boolean;
  accessibleVisibleText?: boolean;
  className?: string;
};

export const PremiumToolCardInner = memo(function PremiumToolCardInner({
  slug,
  label,
  description,
  href,
  index = 0,
  featured = false,
  aiHighlight = false,
  accessibleVisibleText = false,
  className,
}: Omit<PremiumToolCardProps, "disableMotion">) {
  const gradient = ICON_GRADIENTS[index % ICON_GRADIENTS.length];

  return (
    <Link
      href={href}
      data-testid={`tool-card-${slug}`}
      {...(!accessibleVisibleText ? { "aria-label": `${label} — ${description}` } : {})}
      className={cn(
        "group press-scale relative flex min-h-[96px] min-w-0 flex-col rounded-3xl border border-slate-200/50 bg-white/70 p-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 ease-out active:scale-95",
        "hover:border-primary/50 hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-slate-700/50 dark:bg-slate-900/70",
        featured && "ring-1 ring-indigo-400/30",
        aiHighlight &&
          "border-transparent bg-gradient-to-br from-indigo-500/10 via-white/80 to-violet-500/10 shadow-indigo-500/15 ring-2 ring-indigo-400/40 dark:from-indigo-950/40 dark:via-slate-900/80 dark:to-violet-950/30",
        className,
      )}
    >
      {aiHighlight ? (
        <span className="absolute -right-1 -top-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
          Popular
        </span>
      ) : null}
      <span
        className={cn(
          "mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br transition-transform group-hover:scale-105",
          gradient,
        )}
      >
        <ToolIcon slug={slug} className="h-5 w-5" label={accessibleVisibleText ? undefined : label} />
      </span>
      <span className="text-sm font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-base">
        {label}
      </span>
      <span className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:block">
        {description}
      </span>
      <span className="mt-auto hidden pt-2 text-[11px] font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-400 sm:inline-flex sm:items-center sm:gap-0.5">
        Open <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  );
});
