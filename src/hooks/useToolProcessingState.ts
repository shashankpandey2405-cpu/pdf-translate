"use client";

import { useCallback, useMemo, useState } from "react";
import type { EnhancedJobResponse } from "@/lib/enhanced/types";

export type ToolProcessingPhase =
  | "idle"
  | "fileSelected"
  | "modeSelect"
  | "uploading"
  | "queued"
  | "processing"
  | "finalizing"
  | "downloading"
  | "completed"
  | "failed";

type Args = {
  hasFile?: boolean;
  cloudStatus?: EnhancedJobResponse["status"] | "idle" | "downloading";
  uploadProgress?: number;
  localStage?: "upload" | "configure" | "ready" | "processing" | "done";
};

export function useToolProcessingState({
  hasFile = false,
  cloudStatus = "idle",
  uploadProgress,
  localStage = "upload",
}: Args = {}) {
  const [failed, setFailed] = useState(false);

  const phase: ToolProcessingPhase = useMemo(() => {
    if (failed) return "failed";
    if (localStage === "done") return "completed";
    if (cloudStatus === "downloading") return "downloading";
    if (cloudStatus === "done") return "finalizing";
    if (cloudStatus === "processing") return "processing";
    if (cloudStatus === "queued") return "queued";
    if (localStage === "processing") {
      if (uploadProgress !== undefined && uploadProgress < 30) return "uploading";
      return "processing";
    }
    if (hasFile && (localStage === "configure" || localStage === "ready")) return "modeSelect";
    if (hasFile && localStage === "upload") return "fileSelected";
    return "idle";
  }, [cloudStatus, failed, hasFile, localStage, uploadProgress]);

  const resetToFileSelected = useCallback(() => {
    setFailed(false);
  }, []);

  const markFailed = useCallback(() => {
    setFailed(true);
  }, []);

  return { phase, resetToFileSelected, markFailed, setFailed };
}
