"use client";

import { useCallback } from "react";
import { useEnhancedJob } from "@/hooks/useEnhancedJob";
import { useEnhancedResultLifecycle } from "@/hooks/useEnhancedResultLifecycle";
import type { EnhancedJobRunResult } from "@/lib/enhanced/types";
import { outputFilenameForTool, originalNameFromInputKey } from "@/lib/files/deriveOutputFilename";

type RunResult = {
  blob: Blob;
  filename: string;
  cloud: EnhancedJobRunResult;
};

export function usePremiumCloudRun(toolSlug: string, toolName: string) {
  const enhancedJob = useEnhancedJob(toolSlug);
  const lifecycle = useEnhancedResultLifecycle({ toolSlug, toolName });

  const runPremium = useCallback(
    async (
      file: File,
      pageCount: number | null,
      options?: Record<string, unknown>,
    ): Promise<RunResult> => {
      const cloud = await enhancedJob.run(file, pageCount, options);
      const { blob } = await lifecycle.persistFromCloudResult(cloud);
      const fromKey = cloud.inputR2Key ? originalNameFromInputKey(cloud.inputR2Key) : null;
      const original = fromKey ?? file.name;
      const ext = cloud.filename?.includes(".") ? cloud.filename.split(".").pop() : undefined;
      const filename =
        cloud.filename && !cloud.filename.match(/^[a-f0-9-]{20,}\./i)
          ? cloud.filename
          : outputFilenameForTool(toolSlug, original, ext);
      return { blob, filename, cloud };
    },
    [enhancedJob, lifecycle],
  );

  return {
    runPremium,
    cancel: enhancedJob.cancel,
    status: enhancedJob.status,
    progress: enhancedJob.progress,
    error: enhancedJob.error,
    lifecycle,
  };
}
