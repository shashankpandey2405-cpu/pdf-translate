"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
};

type Props = {
  steps: PipelineStep[];
  className?: string;
};

export function ProcessingPipeline({ steps, className }: Props) {
  return (
    <ul className={cn("space-y-3", className)}>
      {steps.map((step, i) => (
        <motion.li
          key={step.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.35 }}
          className="flex items-center gap-3"
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
              step.status === "done" && "border-emerald-500/40 bg-emerald-500/15 text-emerald-700",
              step.status === "active" && "border-primary/50 bg-primary/10 text-primary",
              step.status === "pending" && "border-border bg-muted/50 text-muted-foreground",
            )}
          >
            {step.status === "done" ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : step.status === "active" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <span>{i + 1}</span>
            )}
          </span>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              step.status === "active" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {step.label}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}
