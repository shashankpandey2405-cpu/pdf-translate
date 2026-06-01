"use client";

import { CloudProcessingExperience } from "@/components/processing/CloudProcessingExperience";
import type { ToolProcessingPhase } from "@/hooks/useToolProcessingState";
import type { EnhancedJobResponse } from "@/lib/enhanced/types";

type Props = {
  phase: ToolProcessingPhase;
  progress?: number;
  cloudStatus?: EnhancedJobResponse["status"] | "idle" | "downloading";
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
};

/** Premium cloud processing UI — user-friendly steps only. */
export function ProcessingStatusPanel({
  phase,
  progress = 0,
  cloudStatus = "idle",
  error,
  onRetry,
  onCancel,
}: Props) {
  const active =
    phase === "uploading" ||
    phase === "queued" ||
    phase === "processing" ||
    phase === "finalizing" ||
    phase === "downloading";

  if (phase === "idle" || phase === "fileSelected" || phase === "modeSelect" || phase === "completed") {
    return null;
  }

  return (
    <CloudProcessingExperience
      cloudStatus={cloudStatus}
      backendProgress={progress}
      active={active || phase === "failed"}
      error={phase === "failed" ? error : null}
      onRetry={onRetry}
      onCancel={onCancel}
    />
  );
}
