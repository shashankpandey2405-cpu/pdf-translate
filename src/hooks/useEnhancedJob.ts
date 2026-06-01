"use client";

import { useCallback, useRef, useState } from "react";
import {
  createEnhancedJob,
  EnhancedJobError,
  fetchCreditEstimate,
  pollEnhancedJob,
  presignEnhancedUpload,
  uploadToPresignedUrl,
} from "@/lib/enhanced/enhancedJobClient";
import type { EnhancedJobResponse, EnhancedJobRunResult } from "@/lib/enhanced/types";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { useProcessingMonitor } from "@/context/ProcessingMonitorContext";
import { messageForCloudErrorCode } from "@/lib/processing/cloudErrorCodes";
import { mapProcessingError } from "@/lib/processing/processingErrors";
import { logApiError } from "@/utils/logger";
import { inferUploadContentType } from "@/lib/enhanced/inferUploadContentType";
import { cloudPollDeadlineMs, cloudQueuedTimeoutMs } from "@/lib/enhanced/cloudJobTimeouts";

export type EnhancedJobUiStatus = EnhancedJobResponse["status"] | "idle" | "downloading";

export function useEnhancedJob(toolSlug: string) {
  const { refreshUsage } = useProcessingMode();
  const { recordNetworkUpload } = useProcessingMonitor();
  const [status, setStatus] = useState<EnhancedJobUiStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnhancedJobRunResult | null>(null);
  const abortRef = useRef(false);

  const run = useCallback(
    async (
      file: File,
      pageCount: number | null,
      options?: Record<string, unknown>,
    ): Promise<EnhancedJobRunResult> => {
      abortRef.current = false;
      setError(null);
      setResult(null);
      setStatus("queued");
      setProgress(5);

      try {
        const processingMode =
          typeof options?.processingMode === "string" ? options.processingMode : undefined;

        if (processingMode === "ai_plus") {
          const pages =
            pageCount !== null && Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
          const est = await fetchCreditEstimate({
            toolSlug,
            pageCount: pages,
            fileSize: file.size,
            processingMode: "ai_plus",
          });
          if (!est.canProceed) {
            throw new EnhancedJobError(
              "INSUFFICIENT_CREDITS",
              est.useTrial
                ? "Could not verify your AI trial. Sign in and try again."
                : "Not enough AI credits. Upgrade or buy credits before starting AI processing.",
            );
          }
        }

        const { url, key, jobId: presignJobId, traceId: presignTraceId, contentType } =
          await presignEnhancedUpload(file, {
            toolSlug,
            pageCount,
            processingMode,
          });
        if (abortRef.current) throw new Error("Cancelled");
        setProgress(15);
        await uploadToPresignedUrl(url, file, contentType, {
          key,
          toolSlug,
          processingMode,
        });
        recordNetworkUpload();
        if (abortRef.current) throw new Error("Cancelled");
        setProgress(25);

        const uploadContentType = inferUploadContentType(file);
        const jobOptions = {
          ...(options ?? {}),
          contentType: uploadContentType,
          mimeType: uploadContentType,
        };

        const { jobId, traceId: enqueueTraceId } = await createEnhancedJob({
          toolSlug,
          inputR2Key: key,
          fileSize: file.size,
          pageCount,
          jobId: presignJobId,
          traceId: presignTraceId,
          options: jobOptions,
        });
        const activeTraceId = enqueueTraceId ?? presignTraceId;
        const inputR2Key = key;
        await refreshUsage();
        setProgress(30);
        setStatus("queued");

        const deadline = Date.now() + cloudPollDeadlineMs(toolSlug);
        const queuedTimeoutMs = cloudQueuedTimeoutMs(toolSlug);
        let delayMs = 250;
        let polls = 0;
        let queuedSinceMs: number | null = Date.now();
        let lastProgress = -1;
        let lastProgressAt = Date.now();
        while (Date.now() < deadline) {
          if (abortRef.current) throw new Error("Cancelled");
          if (polls > 0) {
            await new Promise((r) => setTimeout(r, delayMs));
            delayMs = Math.min(delayMs * 1.2, 4000);
          }
          polls += 1;
          const snap = await pollEnhancedJob(jobId);
          setStatus(snap.status);
          if (snap.status === "queued") {
            if (queuedSinceMs === null) queuedSinceMs = Date.now();
          } else {
            queuedSinceMs = null;
          }
          if (
            snap.status === "queued" &&
            queuedSinceMs !== null &&
            Date.now() - queuedSinceMs > queuedTimeoutMs
          ) {
            const aiTools = new Set([
              "chat-pdf",
              "ai-summarize",
              "translate-pdf",
              "smart-scan-ai",
              "ai-question-gen",
            ]);
            throw new EnhancedJobError(
              aiTools.has(toolSlug) ? "ai_worker_unreachable" : "worker_unreachable",
              aiTools.has(toolSlug)
                ? "The AI worker did not pick up your job. Check OPENROUTER_API_KEY, REDIS_URL, and Railway AI worker (see docs/RAILWAY_AI_WORKER.md)."
                : "Cloud workers are not picking up your job. If this persists, redeploy the matching Railway worker pool (compress, ocr, docx, …).",
            );
          }

          const snapProgress = typeof snap.progress === "number" ? snap.progress : 0;
          if (snap.status === "processing") {
            if (snapProgress !== lastProgress) {
              lastProgress = snapProgress;
              lastProgressAt = Date.now();
            } else if (Date.now() - lastProgressAt > 180_000) {
              setProgress((p) => Math.min(92, Math.max(p, 55)));
            }
          }

          setProgress(snapProgress || (snap.status === "processing" ? 50 : snap.status === "queued" ? 35 : 30));

          if (snap.status === "done") {
            const isSessionTool = toolSlug === "chat-pdf" || toolSlug === "ai-question-gen";
            // Always use same-origin download — browser CSP blocks direct R2 fetch.
            const preferredUrl = snap.downloadUrl ?? null;
            if (!preferredUrl && !isSessionTool) {
              throw new Error("Cloud processing finished but the download link could not be generated. Please retry.");
            }
            setStatus("downloading");
            setProgress(98);
            const payload: EnhancedJobRunResult = {
              jobId,
              traceId: snap.traceId ?? activeTraceId,
              downloadUrl: preferredUrl ?? "",
              filename: snap.outputFilename ?? "result",
              inputR2Key: snap.inputR2Key ?? inputR2Key,
              outputR2Key: snap.outputR2Key ?? undefined,
            };
            setProgress(100);
            setResult(payload);
            await refreshUsage();
            return payload;
          }
          if (snap.status === "failed") {
            const code = snap.errorCode ?? "processing_failed";
            const msg = messageForCloudErrorCode(code, snap.errorMessage);
            throw new EnhancedJobError(code, msg);
          }
          if (snap.status === "cancelled") {
            throw new Error("Cloud processing was cancelled.");
          }
        }
        throw new Error(
          toolSlug === "pdf-to-word" || toolSlug === "word-to-pdf"
            ? "Cloud conversion timed out. Try fewer pages, a smaller file, or retry in a minute."
            : "Cloud processing timed out. Please try again.",
        );
      } catch (e) {
        if (e instanceof EnhancedJobError && e.code === "DAILY_LIMIT") {
          await refreshUsage();
        } else {
          const phase =
            e instanceof Error && e.message.includes("timed out")
              ? "poll"
              : e instanceof EnhancedJobError
                ? "enqueue"
                : "cloud_job";
          logApiError({
            url: "/api/enhanced/jobs",
            method: "POST",
            tool_slug: toolSlug,
            phase,
            error: e,
          });
        }
        const mapped = mapProcessingError(e);
        setError(mapped.message);
        setStatus("failed");
        await refreshUsage();
        throw new Error(mapped.message);
      }
    },
    [toolSlug, refreshUsage, recordNetworkUpload],
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
    setStatus("idle");
  }, []);

  return { run, cancel, status, progress, error, result };
}
