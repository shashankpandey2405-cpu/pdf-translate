/**
 * Per-isolate in-memory rate limit fallback when Redis is unavailable.
 * Not shared across Vercel instances — still strictly better than unlimited.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

const MAX_KEYS = 10_000;

function pruneExpired(now: number): void {
  if (store.size < MAX_KEYS) return;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
    if (store.size < MAX_KEYS * 0.8) break;
  }
}

export function memoryBurstIncr(key: string, windowSec: number): number {
  const now = Date.now();
  pruneExpired(now);
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return 1;
  }
  existing.count += 1;
  return existing.count;
}

export function memoryBurstGet(key: string): number {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) return 0;
  return existing.count;
}

/** Conservative limit when falling back from Redis (50% of Redis max). */
export function memoryFallbackMax(redisMax: number): number {
  return Math.max(1, Math.floor(redisMax * 0.5));
}
