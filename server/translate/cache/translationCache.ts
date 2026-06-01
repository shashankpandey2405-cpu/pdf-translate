import { createHash } from "crypto";
import { getQueueRedis } from "@/server/redis/client";

const TTL_SEC = 60 * 60 * 24 * 30; // 30 days

function cacheKey(source: string, target: string, text: string): string {
  const hash = createHash("sha256").update(text, "utf8").digest("hex").slice(0, 32);
  return `mt:v1:${source}:${target}:${hash}`;
}

export async function getCachedTranslation(
  source: string,
  target: string,
  text: string,
): Promise<string | null> {
  const redis = getQueueRedis();
  if (!redis || !text) return null;
  return redis.get(cacheKey(source, target, text));
}

export async function setCachedTranslation(
  source: string,
  target: string,
  text: string,
  translated: string,
): Promise<void> {
  const redis = getQueueRedis();
  if (!redis || !text) return;
  await redis.set(cacheKey(source, target, text), translated, { ex: TTL_SEC });
}
