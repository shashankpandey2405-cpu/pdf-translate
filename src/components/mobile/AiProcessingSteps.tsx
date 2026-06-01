"use client";

import { Check } from "lucide-react";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { cn } from "@/lib/utils";

type StepStatus = "pending" | "active" | "done";

type Step = {
  label: string;
  status: StepStatus;
};

function getSteps(progress: number): Step[] {
  return [
    { label: "Uploading document", status: progress >= 15 ? "done" : progress > 0 ? "active" : "pending" },
    { label: "Analyzing structure", status: progress >= 40 ? "done" : progress >= 15 ? "active" : "pending" },
    { label: "AI deep processing", status: progress >= 75 ? "done" : progress >= 40 ? "active" : "pending" },
    { label: "Generating results", status: progress >= 95 ? "done" : progress >= 75 ? "active" : "pending" },
  ];
}

type Props = {
  progress: number;
  label?: string;
  className?: string;
};

export function AiProcessingSteps({ progress, label, className }: Props) {
  const steps = getSteps(progress);

  return (
    <div className={cn("flex w-full min-w-0 max-w-full flex-col items-center gap-6 py-8", className)}>
      <ProcessingStatus type="ai" progress={progress} label={label ?? "Neural AI processing…"} />

      <div className="w-full max-w-xs space-y-2">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-2.5">
            {step.status === "done" ? (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
            ) : step.status === "active" ? (
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-primary/40 bg-primary/10" />
            ) : (
              <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted" />
            )}
            <span
              className={cn(
                "text-xs transition-colors",
                step.status === "done" && "text-green-600 dark:text-green-400",
                step.status === "active" && "font-medium text-foreground",
                step.status === "pending" && "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
