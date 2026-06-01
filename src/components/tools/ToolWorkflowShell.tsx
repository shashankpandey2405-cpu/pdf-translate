"use client";

import type { ReactNode } from "react";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { getProcessingStatusType } from "@/lib/processing/processingStatusType";
import { ShimmerSkeleton } from "@/components/premium/ShimmerSkeleton";
import { TOOL_PROCESSING_MIN_H } from "@/components/tools/ux/toolUxClasses";
import { cn } from "@/lib/utils";

export type ToolWorkflowStage = "upload" | "configure" | "processing" | "done";

type Props = {
  stage: ToolWorkflowStage;
  progress?: number;
  progressLabel?: string;
  upload: ReactNode;
  configure?: ReactNode;
  done: ReactNode;
  processingTitle?: string;
  processingSubtitle?: string;
  /** Optional processing mode selector (browser vs enhanced). */
  modeSelector?: ReactNode;
  /** Replaces default processing ring when set (e.g. enhanced cloud progress). */
  processingContent?: ReactNode;
  /** Tool slug for processing animation family */
  toolSlug?: string;
  className?: string;
};

/**
 * Shared tool workflow layout: upload → optional configure → processing ring → result.
 */
export function ToolWorkflowShell({
  stage,
  progress,
  progressLabel,
  upload,
  configure,
  done,
  processingTitle = "Processing…",
  processingSubtitle = "Your file is being handled securely.",
  modeSelector,
  processingContent,
  toolSlug,
  className,
}: Props) {
  const pct = typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : undefined;
  const processingType = toolSlug ? getProcessingStatusType(toolSlug) : "cloud";

  return (
    <div className={cn("space-y-6", className)}>
      {modeSelector ? <div className="pb-2">{modeSelector}</div> : null}
      {stage === "upload" && upload}
      {stage === "configure" && configure}
      {stage === "processing" && processingContent ? processingContent : null}
      {stage === "processing" && !processingContent ? (
        <div className={cn("space-y-4", TOOL_PROCESSING_MIN_H)} aria-live="polite" aria-busy="true">
          <div className="mx-auto grid max-w-md gap-3 sm:grid-cols-3">
            <ShimmerSkeleton className="h-20" />
            <ShimmerSkeleton className="h-20" />
            <ShimmerSkeleton className="h-20 hidden sm:block" />
          </div>
          <ProcessingStatus
            type={processingType}
            progress={pct ?? 0}
            label={processingTitle}
            className="py-2"
          />
          {pct !== undefined && progressLabel ? (
            <p className="text-center text-xs text-muted-foreground">{progressLabel}</p>
          ) : null}
        </div>
      ) : null}
      {stage === "done" && done}
    </div>
  );
}
