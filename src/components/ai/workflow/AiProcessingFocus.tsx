"use client";

import { Sparkles } from "lucide-react";
import { AiProcessingSteps } from "@/components/mobile/AiProcessingSteps";
import { cn } from "@/lib/utils";
import { AiFocusShell } from "@/components/ai/workflow/AiFocusShell";

type Props = {
  title?: string;
  progress?: number;
  steps?: string[];
  className?: string;
};

const DEFAULT_STEPS = [
  "Analyzing document…",
  "Extracting content…",
  "Generating results…",
];

/** Full-screen processing — hides upload/preview/settings. */
export function AiProcessingFocus({
  title = "PDF Intelligence Engine",
  progress = 45,
  steps = DEFAULT_STEPS,
  className,
}: Props) {
  const activeIdx = progress >= 75 ? 2 : progress >= 35 ? 1 : 0;

  return (
    <AiFocusShell className={className}>
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" aria-hidden />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {steps.map((label, i) => (
            <li
              key={label}
              className={cn(
                "text-sm transition-colors",
                i < activeIdx && "text-green-600 dark:text-green-400",
                i === activeIdx && "font-medium text-foreground",
                i > activeIdx && "text-muted-foreground",
              )}
            >
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <AiProcessingSteps progress={progress} label={steps[activeIdx] ?? "Processing…"} />
        </div>
      </div>
    </AiFocusShell>
  );
}
