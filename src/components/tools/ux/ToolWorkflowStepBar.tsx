"use client";

import { cn } from "@/lib/utils";

export type ToolWorkflowStepId = "upload" | "configure" | "process" | "done";

const STEPS: { id: ToolWorkflowStepId; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "configure", label: "Options" },
  { id: "process", label: "Process" },
  { id: "done", label: "Download" },
];

type Props = {
  active: ToolWorkflowStepId;
  /** Hide configure step for single-step tools (upload → process → done). */
  hideConfigure?: boolean;
  className?: string;
};

/** Lightweight progress hint — where the user is in the flow. */
export function ToolWorkflowStepBar({ active, hideConfigure, className }: Props) {
  const steps = hideConfigure ? STEPS.filter((s) => s.id !== "configure") : STEPS;
  const activeIndex = steps.findIndex((s) => s.id === active);

  return (
    <nav
      aria-label="Tool progress"
      className={cn("flex w-full items-center gap-1 rounded-xl border border-border/50 bg-muted/30 px-2 py-2", className)}
    >
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const current = step.id === active;
        return (
          <div key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                current && "bg-primary text-primary-foreground",
                done && !current && "bg-primary/20 text-primary",
                !done && !current && "bg-muted text-muted-foreground",
              )}
              aria-current={current ? "step" : undefined}
            >
              {done && !current ? "✓" : index + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-[10px] font-semibold sm:inline",
                current ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span className="mx-0.5 h-px min-w-[6px] flex-1 bg-border/80" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
