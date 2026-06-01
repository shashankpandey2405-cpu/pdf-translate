"use client";

import { Cloud } from "lucide-react";
import ToolProcessingRing from "@/components/tools/ToolProcessingRing";
import type { EnhancedJobResponse } from "@/lib/enhanced/types";

type Props = {
  status: EnhancedJobResponse["status"] | "idle";
  progress: number;
  title?: string;
  subtitle?: string;
};

export function EnhancedJobProgress({
  status,
  progress,
  title = "Cloud processing…",
}: Props) {
  const label =
    status === "queued"
      ? "Queued…"
      : status === "processing"
        ? "Processing…"
        : status === "done"
          ? "Complete"
          : "Starting…";

  return (
    <div className="flex flex-col items-center py-12">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
        <Cloud className="h-4 w-4" />
        Enhanced Cloud Processing
      </div>
      <ToolProcessingRing progress={progress} title={title} type="cloud" />
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
