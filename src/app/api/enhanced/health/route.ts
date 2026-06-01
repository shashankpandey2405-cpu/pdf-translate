import { isAiConfigured } from "@/server/ai/config";
import { modelChainForWorkload } from "@/server/ai/router";
import { isEnhancedInfraConfigured, WORKER_POOLS } from "@/server/enhanced/config";
import { getDeadLetterDepth, getQueueDepth, getRedis, processingQueueKey } from "@/server/enhanced/redis";
import { priorityQueueKeys } from "@/server/enhanced/queueContract";
import { envString } from "@/server/env";
import { redisBackend } from "@/server/redis/client";
import { isServerQaBypassActive } from "@/server/qa/isQaMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedDetailed(req: Request): boolean {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (!isProd) return true;
  const secret =
    envString("INTERNAL_HEALTH_SECRET") ||
    envString("CRON_SECRET") ||
    envString("PDFTRUSTED_QA_SECRET");
  if (!secret) return false;
  const auth = req.headers.get("authorization")?.trim() ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  const detailed = isAuthorizedDetailed(req);
  const redis = getRedis();
  const queues: Record<string, number> = {};
  const queueByPriority: Record<string, Record<string, number>> = {};
  const deadLetters: Record<string, number> = {};
  const processingDepth: Record<string, number> = {};
  if (redis) {
    for (const pool of WORKER_POOLS) {
      queues[pool] = await getQueueDepth(pool);
      deadLetters[pool] = await getDeadLetterDepth(pool);
      if (detailed) {
        processingDepth[pool] = await redis.llen(processingQueueKey(pool));
        const byPri: Record<string, number> = {};
        for (const key of priorityQueueKeys(pool)) {
          byPri[key] = await redis.llen(key);
        }
        queueByPriority[pool] = byPri;
      }
    }
  }

  let redisReachable = false;
  let redisError: string | null = null;
  if (redis) {
    try {
      await Promise.race([
        redis.llen("enhanced:queue:ocr"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
      ]);
      redisReachable = true;
    } catch (e) {
      redisError = e instanceof Error ? e.message : "ping_failed";
    }
  }

  if (!detailed) {
    return Response.json({
      ok: isEnhancedInfraConfigured() && redisReachable,
      redisBackend: redisBackend(),
      redisReachable,
      redisError,
      message: redisReachable
        ? "Cloud queue reachable."
        : "Redis unreachable from this server. Use Railway PUBLIC Redis URL on Vercel (not railway.internal).",
    });
  }

  return Response.json({
    ok: isEnhancedInfraConfigured(),
    qaMode: isServerQaBypassActive(),
    checks: {
      redis: Boolean(redis),
      redisBackend: redisBackend(),
      supabaseServiceRole: Boolean(envString("SUPABASE_SERVICE_ROLE_KEY")),
      workerSecret: Boolean(envString("RENDER_WORKER_SECRET")),
      aiConfigured: isAiConfigured(),
      openRouterKey: Boolean(envString("OPENROUTER_API_KEY")),
      aiModels: {
        translateSmall: modelChainForWorkload({
          task: "translate",
          pageCount: 2,
          totalChars: 5000,
        }),
        summarizeSmall: modelChainForWorkload({
          task: "summarize",
          pageCount: 1,
          totalChars: 3000,
        }),
      },
    },
    queueDepth: queues,
    queueByPriority: detailed ? queueByPriority : undefined,
    processingQueueDepth: detailed ? processingDepth : undefined,
    deadLetterDepth: deadLetters,
    workersPriorityQueues: envString("WORKERS_PRIORITY_QUEUES", "false") === "true",
  });
}
