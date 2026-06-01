/**
 * Long-running AI queue consumer — run on Railway (not Vercel).
 * Start: npm run worker:ai
 */
import { processAiQueueBatch } from "@/server/ai/queueWorker";
import { isAiConfigured } from "@/server/ai/config";
import { getQueueRedis } from "@/server/redis/client";
import { getQueueDepth } from "@/server/enhanced/redis";

const POLL_MS = Number(process.env.AI_WORKER_POLL_MS || "2500") || 2500;
const BATCH_SIZE = Number(process.env.AI_WORKER_BATCH_SIZE || "1") || 1;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.info("[ai-worker] starting PdfTrusted AI consumer");
  if (!isAiConfigured()) {
    console.error("[ai-worker] OPENROUTER_API_KEY missing — exit");
    process.exit(1);
  }
  const redis = getQueueRedis();
  if (!redis) {
    console.error("[ai-worker] REDIS_URL missing — exit");
    process.exit(1);
  }

  try {
    await redis.get("__pdftrusted_ai_worker_ping__");
    console.info("[ai-worker] redis ok, pool=ai depth=", await getQueueDepth("ai"));
  } catch (e) {
    console.error("[ai-worker] redis ping failed", e);
    process.exit(1);
  }

  for (;;) {
    try {
      const result = await processAiQueueBatch(BATCH_SIZE);
      if (result.processed > 0) {
        console.info(`[ai-worker] processed=${result.processed}`);
        continue;
      }
      if (result.skipped === "ai_not_configured" || result.skipped === "redis_unavailable") {
        console.error("[ai-worker] fatal:", result.skipped);
        await sleep(15000);
        continue;
      }
      await sleep(POLL_MS);
    } catch (err) {
      console.error("[ai-worker] loop error", err);
      await sleep(5000);
    }
  }
}

main().catch((err) => {
  console.error("[ai-worker] crashed", err);
  process.exit(1);
});
