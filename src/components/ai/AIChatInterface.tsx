"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AiPrivacyBadge } from "@/components/ai/AiPrivacyBadge";

export type AIChatInterfaceProps = {
  title?: string;
  statusLabel?: string;
  statusOnline?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
  showPrivacyBadge?: boolean;
};

/**
 * Premium AI chat shell — fixed height, smooth scroll, glass styling.
 * Use `children` for the scrollable message area and `footer` for the input row.
 */
export function AIChatInterface({
  title = "PDF Intelligence",
  statusLabel = "Neural AI Online",
  statusOnline = true,
  headerAction,
  children,
  footer,
  className,
  showPrivacyBadge = true,
}: AIChatInterfaceProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/50 shadow-2xl backdrop-blur-xl",
        !className?.includes("h-full") && !className?.includes("h-[") && "max-lg:min-h-[min(420px,55dvh)]",
        className,
      )}
    >
      {showPrivacyBadge ? <AiPrivacyBadge className="mx-3 mt-3 shrink-0" /> : null}

      <div className="flex shrink-0 items-center gap-3 border-b border-border/50 bg-primary/5 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20">
          <span className="text-lg text-white" aria-hidden>
            ✨
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-foreground">{title}</h3>
          <p
            className={cn(
              "text-[10px] font-medium",
              statusOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {statusOnline ? "● " : ""}
            {statusLabel}
          </p>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {children}
        </div>
        <div className="shrink-0 border-t border-border/50 bg-background/50 p-3 sm:p-4">{footer}</div>
      </div>
    </div>
  );
}
