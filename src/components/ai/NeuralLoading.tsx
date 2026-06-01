"use client";

import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function NeuralLoading({
  title = "Neural AI is processing…",
  className,
}: Props) {
  return <ProcessingStatus type="ai" label={title} className={cn("py-6", className)} />;
}
