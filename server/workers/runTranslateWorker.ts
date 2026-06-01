/**
 * Classic (open-source MT) translate queue consumer — Railway.
 * Start: npm run worker:translate
 */
import "regenerator-runtime/runtime";
import { processTranslateQueueBatch } from "@/server/translate/queueWorker";
import { isClassicMtConfigured } from "@/server/translate/config";
import { getQueueRedis } from "@/server/redis/client";
import { getQueueDepth } from "@/server/enhanced/redis";

const POLL_MS = Number(process.env.TRANSLATE_WORKER_POLL_MS || "2500") || 2500;
const BATCH_SIZE = Number(process.env.TRANSLATE_WORKER_BATCH_SIZE || "1") || 1;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.info("[translate-worker] starting PdfTrusted Classic MT consumer");
  if (!isClassicMtConfigured()) {
    console.error("[translate-worker] TRANSLATE_MT_URL missing — exit");
    process.exit(1);
  }
  const redis = getQueueRedis();
  if (!redis) {
    console.error("[translate-worker] REDIS_URL missing — exit");
    process.exit(1);
  }

  try {
    await redis.get("__pdftrusted_translate_worker_ping__");
    console.info("[translate-worker] redis ok, pool=translate depth=", await getQueueDepth("translate"));
  } catch (e) {
    console.error("[translate-worker] redis ping failed", e);
    process.exit(1);
  }

  for (;;) {
    try {
      const result = await processTranslateQueueBatch(BATCH_SIZE);
      if (result.processed > 0) {
        console.info(`[translate-worker] processed=${result.processed}`);
        continue;
      }
      if (result.skipped === "classic_mt_not_configured" || result.skipped === "redis_unavailable") {
        console.error("[translate-worker] fatal:", result.skipped);
        await sleep(15000);
        continue;
      }
      await sleep(POLL_MS);
    } catch (err) {
      console.error("[translate-worker] loop error", err);
      await sleep(5000);
    }
  }
}

main().catch((err) => {
  console.error("[translate-worker] crashed", err);
  process.exit(1);
});
