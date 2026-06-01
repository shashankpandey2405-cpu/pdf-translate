"use client";

import { FileSearch, Lightbulb, ListChecks, ScanLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatDocumentBriefView = {
  summaryText: string;
  documentHighlights: string[];
  suggestedActions: string[];
  readMethod?: "text" | "vision_enhanced";
};

export function ChatDocumentBriefPanel({
  brief,
  className,
}: {
  brief: ChatDocumentBriefView;
  className?: string;
}) {
  const hasSummary = Boolean(brief.summaryText?.trim());
  const hasHighlights = brief.documentHighlights.length > 0;
  const hasActions = brief.suggestedActions.length > 0;

  if (!hasSummary && !hasHighlights && !hasActions) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {brief.readMethod === "vision_enhanced" ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          <ScanLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Scan clarified — I enhanced contrast to read faint or dark areas, then summarized what I saw.
        </p>
      ) : null}

      {hasSummary ? (
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            <h3 className="font-semibold text-foreground">What&apos;s in your file</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{brief.summaryText}</p>
        </div>
      ) : null}

      {hasHighlights ? (
        <div className="rounded-2xl border border-border/60 bg-card/80 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileSearch className="h-3.5 w-3.5" aria-hidden />
            What I read from the document
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/90">
            {brief.documentHighlights.map((line) => (
              <li key={line} className="flex gap-2 leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasActions ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-200/90">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            You might want to
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {brief.suggestedActions.map((action) => (
              <li key={action} className="flex gap-2">
                <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
