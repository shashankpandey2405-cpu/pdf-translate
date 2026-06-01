import { failStuckProcessingJobs, purgeStaleEnhancedJobs } from "@/server/enhanced/purgeStaleEnhanced";
import {
  drainPremiumQueuesToDefault,
  getQueueDepth,
  requeueOrphanedProcessing,
  trimDeadLetter,
} from "@/server/enhanced/redis";
import { WORKER_POOLS } from "@/server/enhanced/config";
import { kickAiQueueAfterEnqueue } from "@/server/ai/queueWorker";
import { envString } from "@/server/env";
import { releaseExpiredCreditHolds } from "@/server/credits/ledger";
import { purgeExpiredStagedObjects } from "@/server/r2StagingPurge";
import { getAppEnv } from "@/server/types";
import { val } from "@/server/strings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

/** Vercel Cron: requires CRON_SECRET Bearer in production; dev allows x-vercel-cron. */
export async function GET(req: Request) {
  const env = getAppEnv();
  const expected = val(env.CRON_SECRET);
  const auth = req.headers.get("authorization")?.trim() ?? "";
  const vercelCron = req.headers.get("x-vercel-cron") === "1";
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  if (isProd) {
    if (!expected || auth !== `Bearer ${expected}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (expected) {
    if (auth !== `Bearer ${expected}`) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (!vercelCron) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const premiumDrained =
      envString("WORKERS_PRIORITY_QUEUES", "false") === "true"
        ? {}
        : await drainPremiumQueuesToDefault();
    const stuck = await failStuckProcessingJobs();
    const aiQueueDepth = await getQueueDepth("ai");
    if (aiQueueDepth > 0) {
      try {
        await kickAiQueueAfterEnqueue();
      } catch (e) {
        console.warn("[cron/r2-staging-purge] ai kick failed", e);
      }
    }
    const requeued: Record<string, number> = {};
    for (const pool of WORKER_POOLS) {
      requeued[pool] = await requeueOrphanedProcessing(pool, 900);
    }
    const dlqTrimmed: Record<string, number> = {};
    for (const pool of WORKER_POOLS) {
      dlqTrimmed[pool] = await trimDeadLetter(pool, 100);
    }
    const r = await purgeExpiredStagedObjects(env);
    const enhanced = await purgeStaleEnhancedJobs(env);
    const creditHolds = await releaseExpiredCreditHolds();
    return Response.json({
      ok: true,
      ...r,
      enhanced,
      stuck,
      premiumDrained,
      aiQueueDepth,
      requeued,
      dlqTrimmed,
      creditHolds,
    });
  } catch (e) {
    console.error("[cron/r2-staging-purge]", e);
    return Response.json({ error: "purge_failed" }, { status: 500 });
  }
}
