import { getQueueRedis } from "@/server/redis/client";
import { popQueueItem, processingQueueKey } from "@/server/enhanced/redis";
import { processAiJob, type AiJobOptions } from "@/server/ai/processor";
import { isAiConfigured } from "@/server/ai/config";
import { drainAiQueueOnVercel, railwayAiWorkerPingUrl } from "@/server/env/aiWorker";

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
    const raw = await popQueueItem(pool);
    if (!raw) break;

    const parsed = parseQueueItem(raw);
    if (!parsed) {
      continue;
    }

    await redis.lpush(procKey, raw);
    const attemptKey = `enhanced:processing:at:${parsed.jobId}`;
    await redis.set(attemptKey, String(Date.now()), { ex: 900 });

    try {
      await processAiJob(parsed.jobId, parsed.inputR2Key, parsed.options, parsed.traceId);
      processed += 1;
    } catch (err) {
      console.error("[ai-queue]", parsed.jobId, err);
    } finally {
      await redis.lrem(procKey, 1, raw);
      await redis.del(attemptKey);
    }
  }

  return { processed, skipped: processed ? "ok" : "empty" };
}

/** Wake Railway AI worker by hitting /ping — triggers immediate queue drain. */
export async function pingRailwayAiWorker(): Promise<void> {
  const base = railwayAiWorkerPingUrl();
  if (!base) return;
  const url = `${base.replace(/\/$/, "")}/ping`;
  try {
    fetch(url, { method: "POST" }).catch((err) => {
      console.warn("[ai-queue] railway ping failed:", err);
    });
  } catch (err) {
    console.warn("[ai-queue] railway ping failed:", err);
  }
}

/** Trigger the dedicated /api/internal/ai-process endpoint (has maxDuration=300). */
export async function triggerAiQueueProcessing(): Promise<void> {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const base =
    process.env.ENHANCED_CALLBACK_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    vercelUrl ||
    "http://localhost:3000";
  const secret = process.env.CRON_SECRET?.trim() || process.env.RENDER_WORKER_SECRET?.trim();
  const url = `${base.replace(/\/$/, "")}/api/internal/ai-process`;
  const headers: Record<string, string> = {};
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
    headers["x-worker-secret"] = secret;
  }
  try {
    fetch(url, { method: "POST", headers }).catch((err) => {
      console.error("[ai-queue] trigger ai-process failed:", err);
    });
  } catch (err) {
    console.error("[ai-queue] trigger ai-process failed:", err);
  }
}

/**
 * After enqueue:
 * 1. If Railway URL configured → ping Railway to drain
 * 2. If AI_QUEUE_DRAIN_ON_VERCEL=true → Vercel drains via ai-process route
 * 3. Fallback: always trigger Vercel ai-process as safety net
 */
export async function kickAiQueueAfterEnqueue(): Promise<void> {
  const railwayUrl = railwayAiWorkerPingUrl();

  if (railwayUrl) {
    await pingRailwayAiWorker();
    return;
  }

  if (drainAiQueueOnVercel()) {
    await triggerAiQueueProcessing();
    return;
  }

  triggerAiQueueProcessing();
}
