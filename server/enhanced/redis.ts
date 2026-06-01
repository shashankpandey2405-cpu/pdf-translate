import { getQueueRedis } from "@/server/redis/client";
import { queueKeyForPool, type WorkerPool } from "@/server/enhanced/config";

export type QueuePriority = "premium" | "default" | "free";

export function getRedis() {
  return getQueueRedis();
}

function queueKeysForPool(pool: WorkerPool, priority?: QueuePriority): string {
  const base = queueKeyForPool(pool);
  if (priority === "premium") return `${base}:premium`;
  if (priority === "free") return `${base}:free`;
  return base;
}

/** Premium first, then default, then free tier. */
export async function popQueueItem(pool: WorkerPool): Promise<string | null> {
  return claimQueueItem(pool);
}

/**
 * Atomically claim a queue item into the processing list (BRPOPLPUSH-style via RPOPLPUSH).
 * Phase 8: safer multi-worker semantics.
 */
export async function claimQueueItem(pool: WorkerPool): Promise<string | null> {
  const redis = getQueueRedis();
  if (!redis) return null;
  const procKey = processingQueueKey(pool);
  for (const key of [
    queueKeysForPool(pool, "premium"),
    queueKeysForPool(pool, "default"),
    queueKeysForPool(pool, "free"),
  ]) {
    const item = await redis.rpoplpush(key, procKey);
    if (item) return item;
  }
  return null;
}

export async function enqueueJob(
  pool: WorkerPool,
  jobId: string,
  inputR2Key: string,
  options?: Record<string, unknown>,
  traceId?: string,
  priority: QueuePriority = "default",
): Promise<boolean> {
  const redis = getQueueRedis();
  if (!redis) return false;
  const optsPart =
    options && Object.keys(options).length > 0
      ? `|${encodeURIComponent(JSON.stringify(options))}`
      : "";
  const tracePart = traceId ? `|${traceId}` : "";
  const key = queueKeysForPool(pool, priority);
  await redis.lpush(key, `${jobId}|${inputR2Key}${optsPart}${tracePart}`);
  return true;
}

export function processingQueueKey(pool: WorkerPool): string {
  return `${queueKeyForPool(pool)}:processing`;
}

export function deadQueueKey(pool: WorkerPool): string {
  return `enhanced:dead:${pool}`;
}

export async function requeueOrphanedProcessing(pool: WorkerPool, maxAgeSec: number): Promise<number> {
  const redis = getQueueRedis();
  if (!redis) return 0;
  const procKey = processingQueueKey(pool);
  const items = await redis.lrange(procKey, 0, -1);
  if (!items?.length) return 0;
  let moved = 0;
  for (const raw of items) {
    const parts = raw.split("|");
    const jobId = parts[0];
    const attemptKey = `enhanced:processing:at:${jobId}`;
    const startedRaw = await redis.get(attemptKey);
    const started = startedRaw ? Number(startedRaw) : 0;
    if (started && Date.now() - started < maxAgeSec * 1000) continue;
    await redis.lrem(procKey, 1, raw);
    await redis.lpush(queueKeysForPool(pool, "default"), raw);
    await redis.del(attemptKey);
    moved += 1;
  }
  return moved;
}

/**
 * Move jobs stuck on `:premium` lists into the default queue when
 * `WORKERS_PRIORITY_QUEUES` is false (legacy workers only pop default).
 */
export async function drainPremiumQueuesToDefault(): Promise<Record<string, number>> {
  const redis = getQueueRedis();
  if (!redis) return {};
  const moved: Record<string, number> = {};
  for (const pool of [
    "ocr",
    "docx",
    "compress",
    "excel",
    "office",
    "security",
    "convert",
    "ai",
    "translate",
  ] as WorkerPool[]) {
    const premiumKey = queueKeysForPool(pool, "premium");
    const defaultKey = queueKeysForPool(pool, "default");
    let count = 0;
    for (let i = 0; i < 200; i += 1) {
      const item = await redis.rpop(premiumKey);
      if (!item) break;
      await redis.lpush(defaultKey, item);
      count += 1;
    }
    if (count > 0) moved[pool] = count;
  }
  return moved;
}

export async function getQueueDepth(pool: WorkerPool): Promise<number> {
  const redis = getQueueRedis();
  if (!redis) return 0;
  const keys = [
    queueKeysForPool(pool, "premium"),
    queueKeysForPool(pool, "default"),
    queueKeysForPool(pool, "free"),
  ];
  let total = 0;
  for (const key of keys) {
    total += (await redis.llen(key)) ?? 0;
  }
  return total;
}

export async function getDeadLetterDepth(pool: WorkerPool): Promise<number> {
  const redis = getQueueRedis();
  if (!redis) return 0;
  return (await redis.llen(deadQueueKey(pool))) ?? 0;
}

/** Trim dead-letter queue; returns removed count. */
export async function trimDeadLetter(pool: WorkerPool, maxKeep = 100): Promise<number> {
  const redis = getQueueRedis();
  if (!redis) return 0;
  const key = deadQueueKey(pool);
  const len = (await redis.llen(key)) ?? 0;
  if (len <= maxKeep) return 0;
  const remove = len - maxKeep;
  for (let i = 0; i < remove; i += 1) {
    await redis.rpop(key);
  }
  return remove;
}

export async function rateLimitIncr(key: string, windowSec: number): Promise<number> {
  const redis = getQueueRedis();
  if (!redis) return 0;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSec);
  }
  return count;
}

/** Read current counter without incrementing (0 if missing). */
export async function rateLimitGet(key: string): Promise<number> {
  const redis = getQueueRedis();
  if (!redis) return 0;
  const val = await redis.get(key);
  return val ? Number(val) : 0;
}
