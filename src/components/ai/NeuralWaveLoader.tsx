"use client";

import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
};

export function NeuralWaveLoader({ label = "Neural processing…", className }: Props) {
  return <ProcessingStatus type="ai" label={label} className={cn("py-4", className)} />;
}
