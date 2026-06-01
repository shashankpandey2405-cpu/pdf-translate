"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StickyToolBreadcrumbs } from "@/components/tools/StickyToolBreadcrumbs";
import { ToolQuickSwitcher } from "@/components/tools/ToolQuickSwitcher";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { ToolHelpLinks } from "@/components/seo/ToolHelpLinks";

type Props = {
  children: ReactNode;
  className?: string;
  maxWidth?: "5xl" | "6xl" | "7xl";
  slug?: string;
  toolName?: string;
  focusMode?: boolean;
  showQuickSwitcher?: boolean;
};

export function ToolPagePremiumLayout({
  children,
  className,
  maxWidth = "6xl",
  slug,
  toolName,
  focusMode = true,
  showQuickSwitcher = true,
}: Props) {
  const max =
    maxWidth === "7xl" ? "max-w-7xl" : maxWidth === "6xl" ? "max-w-6xl" : "max-w-5xl";

  return (
    <div
      className={cn("relative mx-auto w-full min-w-0 max-w-full px-4 py-6 sm:px-6 sm:py-8", max, className)}
    >
      <div className="relative">
        {toolName ? <StickyToolBreadcrumbs toolName={toolName} slug={slug} /> : null}

        <ToolRenderErrorBoundary>
          <div className={cn(slug && showQuickSwitcher ? "lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_240px]" : "")}>
            <div className={cn(focusMode && "flex min-h-[70dvh] flex-col")}>
              {children}
              {slug && showQuickSwitcher ? (
                <ToolQuickSwitcher slug={slug} variant="horizontal" className="mt-8 lg:hidden" />
              ) : null}
            </div>
            {slug && showQuickSwitcher ? <ToolQuickSwitcher slug={slug} variant="sidebar" /> : null}
          </div>
        </ToolRenderErrorBoundary>

        {slug && toolName ? (
          <footer className="mt-8 border-t border-border/40 pt-4">
            <ToolHelpLinks slug={slug} toolName={toolName} />
          </footer>
        ) : null}
      </div>
    </div>
  );
}
