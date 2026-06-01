"use client";

import { CheckCircle2 } from "lucide-react";
import { processingPathCopy } from "@/lib/processing/processingPathLabels";

type Props = {
  slug: string;
  executedVia: "browser" | "cloud";
  className?: string;
};

/** Shown on the result step — honest “where processing happened”. */
export function ProcessingPathResultBanner({ slug, executedVia, className }: Props) {
  const copy = processingPathCopy(slug, executedVia);
  return (
    <div
      className={
        className ??
        "rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5 text-xs text-muted-foreground"
      }
    >
      <p className="flex items-start gap-2 font-medium text-foreground">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        {copy.resultLine}
      </p>
    </div>
  );
}
