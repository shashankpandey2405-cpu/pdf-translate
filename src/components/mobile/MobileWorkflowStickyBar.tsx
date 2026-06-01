"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Fixed bottom CTA for workflow tools on mobile (above bottom nav). */
export function MobileWorkflowStickyBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[35] border-t border-border/60 bg-background/95 px-4 py-2.5 backdrop-blur-md lg:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
