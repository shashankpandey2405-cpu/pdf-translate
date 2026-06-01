"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ToolPrivacyNote } from "@/components/tools/ToolPrivacyNote";
import { cn } from "@/lib/utils";

export type ToolWorkspaceStep = {
  number: string;
  title: string;
  description: string;
};

type Props = {
  workspace: ReactNode;
  optionsTitle: string;
  optionsDescription?: string;
  infoAlert?: ReactNode;
  options?: ReactNode;
  footer?: ReactNode;
  steps?: ToolWorkspaceStep[];
  hideAds?: boolean;
  showSidebarAd?: boolean;
  className?: string;
};

/**
 * iLovePDF-style tool layout: canvas workspace (left) + options panel (right).
 */
export function ToolWorkspaceLayout({
  workspace,
  optionsTitle,
  optionsDescription,
  infoAlert,
  options,
  footer,
  steps,
  hideAds = false,
  showSidebarAd = false,
  className,
}: Props) {
  return (
    <div className={cn("w-full min-w-0 max-w-full space-y-6 sm:space-y-8", className)}>
      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid w-full min-w-0 lg:min-h-[min(70vh,640px)] lg:grid-cols-[1fr_minmax(280px,360px)]">
          <div className="tool-workspace-main flex min-h-[min(36vh,320px)] min-w-0 flex-col touch-pan-y bg-muted/30 p-3 sm:p-6 max-lg:overflow-visible lg:min-h-[320px] lg:max-h-[min(78vh,720px)] lg:overflow-y-auto lg:overscroll-y-auto">
            {workspace}
          </div>

          <aside className="flex min-h-0 flex-col border-t border-border bg-card lg:border-l lg:border-t-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold text-foreground">{optionsTitle}</h2>
              {optionsDescription ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{optionsDescription}</p>
              ) : null}
              {infoAlert ? <div className="mt-3">{infoAlert}</div> : null}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{options}</div>

            {steps && steps.length > 0 ? (
              <div className="border-t border-border px-5 py-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  How it works
                </p>
                <ol className="space-y-2.5">
                  {steps.map((step) => (
                    <li key={step.number} className="flex gap-2.5 text-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                        {step.number}
                      </span>
                      <span>
                        <span className="font-semibold text-foreground">{step.title}</span>
                        <span className="mt-0.5 block text-muted-foreground leading-snug">
                          {step.description}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
              {footer}
              <ToolPrivacyNote />
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

/** Blue info callout for sidebar (scanned PDF hint, etc.). */
export function ToolSidebarInfoAlert({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-950 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-100"
      role="status"
    >
      <span className="mt-0.5 shrink-0 font-bold text-sky-600 dark:text-sky-400" aria-hidden>
        i
      </span>
      <div>{children}</div>
    </div>
  );
}

/** Primary full-width CTA at bottom of options panel. */
export function ToolSidebarPrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  showArrow = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  showArrow?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{children}</span>
      {showArrow ? (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : null}
    </button>
  );
}
