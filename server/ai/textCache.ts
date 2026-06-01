/**
 * Optional Redis cache for extracted PDF text (AI Phase 7).
 * Key scoped per job input to avoid cross-user leakage.
 */
import { getQueueRedis } from "@/server/redis/client";
import { createHash } from "crypto";

const TTL_SEC = 86400;

function cacheKey(inputR2Key: string, pageRange: string): string {
  const h = createHash("sha256").update(`${inputR2Key}:${pageRange}`).digest("hex").slice(0, 32);
  return `ai:text:${h}`;
}

export async function getCachedExtractedText(
  inputR2Key: string,
  pageRange: string,
): Promise<string | null> {
  const redis = getQueueRedis();
  if (!redis) return null;
  return redis.get(cacheKey(inputR2Key, pageRange));
}

export async function setCachedExtractedText(
  inputR2Key: string,
  pageRange: string,
  text: string,
): Promise<void> {
  const redis = getQueueRedis();
  if (!redis || !text.trim()) return;
  await redis.set(cacheKey(inputR2Key, pageRange), text, { ex: TTL_SEC });
}
