"use client";

import { Monitor, Cloud, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  processingPathCopy,
  processingPathKindForSlug,
  type ProcessingPathKind,
} from "@/lib/processing/processingPathLabels";

type Props = {
  slug: string;
  /** When set, shows the path used for the last run (result step). */
  executedVia?: "browser" | "cloud";
  className?: string;
  compact?: boolean;
};

const ICONS: Record<ProcessingPathKind, typeof Monitor> = {
  browser: Monitor,
  cloud: Cloud,
  hybrid: Layers,
};

export function ProcessingPathBadge({ slug, executedVia, className, compact }: Props) {
  const copy = processingPathCopy(slug, executedVia);
  const kind = executedVia ?? processingPathKindForSlug(slug);
  const Icon = executedVia === "cloud" ? Cloud : executedVia === "browser" ? Monitor : ICONS[kind];

  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-col gap-0.5 rounded-xl border border-border/80 bg-muted/40 px-3 py-2",
        className,
      )}
      title={copy.hint}
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        {copy.badge}
      </span>
      {!compact ? (
        <span className="text-[11px] leading-snug text-muted-foreground">{copy.hint}</span>
      ) : null}
    </div>
  );
}
