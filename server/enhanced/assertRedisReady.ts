import { getQueueRedis, redisBackend } from "@/server/redis/client";
import { queueKeyForPool, workerPoolForTool } from "@/server/enhanced/config";
import { logQueueEvent } from "@/server/enhanced/queueLog";

const REDIS_PING_MS = 4_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
    }),
  ]);
}

/** Returns 503 Response if Redis is missing or unreachable; null if OK. */
export async function assertRedisReady(toolSlug?: string): Promise<Response | null> {
  const backend = redisBackend();
  if (backend === "none") {
    logQueueEvent("redis_unavailable", { toolSlug, reason: "not_configured" });
    return Response.json(
      {
        error: "redis_unavailable",
        message:
          "Cloud queue not configured. Set REDIS_URL on Vercel (Railway public Redis URL, not *.railway.internal).",
      },
      { status: 503 },
    );
  }

  const redis = getQueueRedis();
  if (!redis) {
    logQueueEvent("redis_unavailable", { toolSlug, reason: "client_null" });
    return Response.json(
      {
        error: "redis_unavailable",
        message: "Cloud processing queue is unavailable.",
      },
      { status: 503 },
    );
  }

  const pool = toolSlug ? workerPoolForTool(toolSlug) : "ocr";
  const pingKey = pool ? queueKeyForPool(pool) : "enhanced:queue:ocr";

  try {
    await withTimeout(redis.llen(pingKey), REDIS_PING_MS, "redis_ping");
    logQueueEvent("redis_ping_ok", { toolSlug, backend, pool: pool ?? "ocr" });
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "redis_ping_failed";
    logQueueEvent("redis_ping_failed", { toolSlug, backend, message, pool: pool ?? "ocr" });
    const hint =
      backend === "tcp"
        ? " Vercel must use Railway Redis PUBLIC TCP URL (enable TCP proxy in Railway → Redis → Connect). Internal URLs (*.railway.internal) only work inside Railway."
        : "";
    return Response.json(
      {
        error: "redis_unavailable",
        message: `Cannot reach cloud queue. Try again later.${hint}`,
        detail: message,
      },
      { status: 503 },
    );
  }
}
