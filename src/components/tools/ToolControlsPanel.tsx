"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** Responsive grid shell for sliders, selects, and labeled controls on tool pages. */
export function ToolControlsPanel({ title, description, children, className }: Props) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card/90 p-4 shadow-sm shadow-primary/5 sm:p-6",
        className,
      )}
    >
      {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
      {description ? (
        <p className={cn("text-sm text-muted-foreground", title ? "mt-1.5" : "")}>{description}</p>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6",
          title || description ? "mt-4" : "",
        )}
      >
        {children}
      </div>
    </section>
  );
}
