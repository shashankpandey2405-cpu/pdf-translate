import { getQueueRedis } from "@/server/redis/client";
import { claimQueueItem, processingQueueKey } from "@/server/enhanced/redis";
import { postAiWorkerCallback } from "@/server/ai/workerCallback";
import { isClassicMtConfigured } from "@/server/translate/config";
import { processClassicTranslateJob } from "@/server/translate/classicTranslateJob";
import type { ClassicTranslateJobOptions } from "@/server/translate/types";

export function parseTranslateQueueItem(raw: string): {
  jobId: string;
  inputR2Key: string;
  options: ClassicTranslateJobOptions & { creditHoldAmount?: number };
  traceId?: string;
} | null {
  const parts = raw.split("|");
  const jobId = parts[0];
  const inputR2Key = parts[1];
  if (!jobId || !inputR2Key) return null;
  let options: ClassicTranslateJobOptions & { creditHoldAmount?: number } = {};
  let traceId: string | undefined;
  if (parts[2]) {
    try {
      options = JSON.parse(decodeURIComponent(parts[2])) as ClassicTranslateJobOptions & {
        creditHoldAmount?: number;
      };
    } catch {
      options = {};
    }
  }
  if (parts[3]) traceId = parts[3];
  return { jobId, inputR2Key, options, traceId };
}

export async function processTranslateQueueBatch(
  maxJobs = 2,
): Promise<{ processed: number; skipped: string }> {
  if (!isClassicMtConfigured()) {
    return { processed: 0, skipped: "classic_mt_not_configured" };
  }

  const redis = getQueueRedis();
  if (!redis) {
    return { processed: 0, skipped: "redis_unavailable" };
  }

  const pool = "translate" as const;
  const procKey = processingQueueKey(pool);
  let processed = 0;

  for (let i = 0; i < maxJobs; i += 1) {
    const raw = await claimQueueItem(pool);
    if (!raw) break;

    const parsed = parseTranslateQueueItem(raw);
    if (!parsed) {
      await redis.lrem(procKey, 1, raw);
      continue;
    }

    const lockKey = `enhanced:translate:lock:${parsed.jobId}`;
    const locked = await redis.set(lockKey, String(Date.now()), { nx: true, ex: 900 });
    if (!locked) {
      await redis.lrem(procKey, 1, raw);
      continue;
    }

    const attemptKey = `enhanced:processing:at:${parsed.jobId}`;
    await redis.set(attemptKey, String(Date.now()), { ex: 900 });

    try {
      await processClassicTranslateJob(
        parsed.jobId,
        parsed.inputR2Key,
        parsed.options,
        parsed.traceId,
      );
      processed += 1;
    } catch (err) {
      console.error("[translate-queue]", parsed.jobId, err);
    } finally {
      await redis.lrem(procKey, 1, raw);
      await redis.del(lockKey);
    }
  }

  return { processed, skipped: processed > 0 ? "" : "empty" };
}

export async function kickTranslateQueueAfterEnqueue(): Promise<{ mode: string }> {
  if (!isClassicMtConfigured()) return { mode: "classic_mt_not_configured" };
  const batch = await processTranslateQueueBatch(1);
  return { mode: batch.processed > 0 ? "inline" : "queued" };
}
