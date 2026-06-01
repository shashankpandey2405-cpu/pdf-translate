import { getQueueRedis } from "@/server/redis/client";
import { claimQueueItem, processingQueueKey } from "@/server/enhanced/redis";
import { processAiJob, type AiJobOptions } from "@/server/ai/processor";
import { postAiWorkerCallback } from "@/server/ai/workerCallback";
import { isAiConfigured } from "@/server/ai/config";
import { drainAiQueueOnVercel, railwayAiWorkerPingUrl } from "@/server/env/aiWorker";
import { envString } from "@/server/env";
import { internalWorkerAuthHeaders, postInternalWorker } from "@/server/internal/workerFetch";

function parseQueueItem(raw: string): {
  jobId: string;
  inputR2Key: string;
  options: AiJobOptions;
  traceId?: string;
} | null {
  const parts = raw.split("|");
  const jobId = parts[0];
  const inputR2Key = parts[1];
  if (!jobId || !inputR2Key) return null;
  let options: AiJobOptions = {};
  let traceId: string | undefined;
  if (parts[2]) {
    try {
      options = JSON.parse(decodeURIComponent(parts[2])) as AiJobOptions;
    } catch {
      options = {};
    }
  }
  if (parts[3]) traceId = parts[3];
  return { jobId, inputR2Key, options, traceId };
}

export async function processAiQueueBatch(maxJobs = 2): Promise<{ processed: number; skipped: string }> {
  if (!isAiConfigured()) {
    return { processed: 0, skipped: "ai_not_configured" };
  }

  const redis = getQueueRedis();
  if (!redis) {
    return { processed: 0, skipped: "redis_unavailable" };
  }

  const pool = "ai" as const;
  const procKey = processingQueueKey(pool);
  let processed = 0;

  for (let i = 0; i < maxJobs; i += 1) {
    const raw = await claimQueueItem(pool);
    if (!raw) break;

    const parsed = parseQueueItem(raw);
    if (!parsed) {
      await redis.lrem(procKey, 1, raw);
      continue;
    }

    const attemptKey = `enhanced:processing:at:${parsed.jobId}`;
    await redis.set(attemptKey, String(Date.now()), { ex: 900 });

    try {
      await processAiJob(parsed.jobId, parsed.inputR2Key, parsed.options, parsed.traceId);
      processed += 1;
    } catch (err) {
      console.error("[ai-queue]", parsed.jobId, err);
      try {
        await postAiWorkerCallback({
          jobId: parsed.jobId,
          status: "failed",
          errorCode: "processing_failed",
          errorMessage: err instanceof Error ? err.message.slice(0, 400) : "AI processing failed",
          traceId: parsed.traceId,
        });
      } catch (cbErr) {
        console.error("[ai-queue] failed callback error:", cbErr);
      }
    } finally {
      await redis.lrem(procKey, 1, raw);
      await redis.del(attemptKey);
    }
  }

  return { processed, skipped: processed ? "ok" : "empty" };
}

function enhancedCallbackBase(): string {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  return (
    envString("ENHANCED_CALLBACK_URL")?.trim() ||
    envString("NEXT_PUBLIC_APP_URL")?.trim() ||
    vercelUrl ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Wake Railway AI worker — processes at least one job when authorized. */
export async function pingRailwayAiWorker(): Promise<{ ok: boolean; status: number }> {
  const base = railwayAiWorkerPingUrl();
  if (!base) return { ok: false, status: 0 };
  const url = `${base.replace(/\/$/, "")}/api/internal/ai-worker-ping`;
  const result = await postInternalWorker(url, { timeoutMs: 15_000, label: "railway-ai-ping" });
  return { ok: result.ok, status: result.status };
}

/** Trigger Vercel `/api/internal/ai-process` (maxDuration=300). */
export async function triggerAiQueueProcessing(): Promise<{ ok: boolean; status: number }> {
  const url = `${enhancedCallbackBase()}/api/internal/ai-process`;
  const result = await postInternalWorker(url, { timeoutMs: 20_000, label: "ai-process" });
  return { ok: result.ok, status: result.status };
}

/**
 * After enqueue:
 * 1. Vercel drain when configured (or no Railway URL)
 * 2. Railway ping when URL is set
 * 3. Always fire Vercel ai-process as safety net when Railway ping fails or is absent
 */
export async function kickAiQueueAfterEnqueue(): Promise<void> {
  const railwayUrl = railwayAiWorkerPingUrl();
  const drainOnVercel = drainAiQueueOnVercel();

  if (drainOnVercel || !railwayUrl) {
    const vercel = await triggerAiQueueProcessing();
    if (vercel.ok) return;
    if (railwayUrl) {
      await pingRailwayAiWorker();
    }
    return;
  }

  const ping = await pingRailwayAiWorker();
  if (!ping.ok) {
    console.warn("[ai-queue] Railway ping failed — falling back to Vercel ai-process");
    await triggerAiQueueProcessing();
    return;
  }

  await triggerAiQueueProcessing();
}
