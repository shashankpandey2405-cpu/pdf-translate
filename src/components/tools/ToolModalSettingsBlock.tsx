"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/** Tool options block shown inside the pre-process (premium / mode) popup. */
export function ToolModalSettingsBlock({ title, children, className }: Props) {
  return (
    <div className={cn("rounded-xl border border-border bg-muted/25 p-3 sm:rounded-2xl sm:p-4", className)}>
      {title ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      ) : null}
      {children}
    </div>
  );
}
