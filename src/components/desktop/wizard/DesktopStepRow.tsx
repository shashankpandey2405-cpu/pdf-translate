"use client";

import { Check, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon?: LucideIcon;
  iconNode?: ReactNode;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  badge?: string;
};

export function DesktopStepRow({
  icon: Icon,
  iconNode,
  iconClassName,
  title,
  subtitle,
  selected,
  disabled,
  onClick,
  badge,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200",
        selected
          ? "border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border/80 bg-white hover:border-primary/30 hover:bg-slate-50/80",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground group-hover:text-primary",
          iconClassName,
        )}
      >
        {iconNode ?? (Icon ? <Icon className="h-5 w-5" aria-hidden /> : null)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge ? (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              {badge}
            </span>
          ) : null}
        </span>
        {subtitle ? <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{subtitle}</span> : null}
      </span>
      {selected ? (
        <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" aria-hidden />
      )}
    </button>
  );
}
