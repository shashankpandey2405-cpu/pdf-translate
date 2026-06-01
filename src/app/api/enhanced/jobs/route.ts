import * as Sentry from "@sentry/nextjs";
import { randomUUID } from "crypto";
import { captureApiException } from "@/server/monitoring/capture";
import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import {
  QUEUE_MAX_DEPTH,
  enhancedMaxFileBytesForTool,
  enhancedPageLimitForTool,
  isEnhancedInfraConfigured,
  workerPoolForTool,
} from "@/server/enhanced/config";
import { parseProcessingMode } from "@/server/ai/config";
import { reserveAiTrialSlot } from "@/server/ai/usageLimits";
import { assertCanRunAiPlus } from "@/server/ai/assertAiAccess";
import { estimateAiCredits } from "@/server/credits/calculator";
import { reserveCredits } from "@/server/credits/ledger";
import { kickAiQueueAfterEnqueue } from "@/server/ai/queueWorker";
import { after } from "next/server";
import { isAiConfigured } from "@/server/ai/config";
import { createProcessingJob, failProcessingJob } from "@/server/enhanced/jobStore";
import { assertRedisReady } from "@/server/enhanced/assertRedisReady";
import { enqueueJob, getQueueDepth } from "@/server/enhanced/redis";
import { assertEnhancedIpQuota, recordEnhancedIpQuota } from "@/server/enhanced/rateLimits";
import { logQueueEvent } from "@/server/enhanced/queueLog";
import { reserveEnhancedJobSlot } from "@/server/enhanced/usageLimits";
import { appendJobTraceEvent } from "@/server/usage/jobTrace";
import { runApiGuard } from "@/server/security/apiGuard";
import { getAppEnv } from "@/server/types";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { assessDocumentScale } from "@/server/processing/documentScale";
import { envString } from "@/server/env";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function postJobs(req: Request) {
  try {
  const guard = await runApiGuard(req, { burstBucket: "enhanced_jobs", ipHourlyMax: 40 });
  if (guard) return guard;

  if (!isEnhancedInfraConfigured()) {
    return Response.json({ error: "enhanced_unavailable", message: "Enhanced processing is not configured." }, { status: 503 });
  }

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  let body: {
    toolSlug?: unknown;
    inputR2Key?: unknown;
    fileSize?: unknown;
    pageCount?: unknown;
    jobId?: unknown;
    traceId?: unknown;
    options?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug : "";
  const inputR2Key = typeof body.inputR2Key === "string" ? body.inputR2Key : "";
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
  const presignJobId = typeof body.jobId === "string" && body.jobId.trim() ? body.jobId.trim() : undefined;
  const jobOptions =
    body.options && typeof body.options === "object" && !Array.isArray(body.options)
      ? (body.options as Record<string, unknown>)
      : undefined;
  const pageCount =
    body.pageCount === null || body.pageCount === undefined
      ? null
      : typeof body.pageCount === "number"
        ? body.pageCount
        : Number(body.pageCount);

  if (!toolSlug || !inputR2Key || !Number.isFinite(fileSize)) {
    return Response.json({ error: "invalid_request", message: "toolSlug, inputR2Key, fileSize required" }, { status: 400 });
  }

  if (!inputR2Key.startsWith(`enhanced/input/${user.id}/`)) {
    return Response.json({ error: "invalid_key", message: "Upload key does not match user." }, { status: 403 });
  }

  if (presignJobId && !inputR2Key.includes(`/${presignJobId}-`)) {
    return Response.json({ error: "invalid_key", message: "jobId does not match upload key." }, { status: 403 });
  }

  const processingMode = parseProcessingMode(jobOptions?.processingMode);
  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);

  const ipCheck = await assertEnhancedIpQuota(ip, isPremium);
  if (!ipCheck.allowed) {
    return Response.json({ error: "DAILY_LIMIT", message: ipCheck.reason }, { status: 429 });
  }

  const maxBytes = enhancedMaxFileBytesForTool(toolSlug, processingMode ?? undefined, { isPremium });
  if (fileSize > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return Response.json(
      { error: "file_too_large", message: `Upload limit for this mode is ${mb} MB.` },
      { status: 413 },
    );
  }

  const pageCap = enhancedPageLimitForTool(toolSlug, processingMode ?? undefined, { isPremium });
  if (pageCount !== null && Number.isFinite(pageCount) && pageCount > pageCap) {
    return Response.json(
      { error: "too_many_pages", message: `Enhanced processing for this tool supports up to ${pageCap} pages.` },
      { status: 413 },
    );
  }

  let pool = workerPoolForTool(toolSlug);
  if (processingMode === "ocr_cloud" && toolSlug === "translate-pdf") {
    pool = "ocr";
  }
  if (!pool) {
    return Response.json({ error: "unsupported_tool", message: "This tool does not support enhanced processing yet." }, { status: 400 });
  }

  if (pool === "ai" && !isAiConfigured()) {
    return Response.json(
      {
        error: "ai_not_configured",
        message: "AI processing is not configured. Set OPENROUTER_API_KEY on Vercel.",
      },
      { status: 503 },
    );
  }

  const redisBlock = await assertRedisReady(toolSlug);
  if (redisBlock) return redisBlock;

  const depth = await getQueueDepth(pool);
  if (depth >= QUEUE_MAX_DEPTH) {
    return Response.json(
      { error: "QUEUE_BUSY", message: "Cloud processors are busy. Please try again in a few minutes." },
      { status: 503, headers: { "Retry-After": "120" } },
    );
  }

  const jobIdForSlot = presignJobId ?? randomUUID();

  const aiOptionExtras: Record<string, unknown> = {};
  if (processingMode === "ai_plus") {
    const pages = pageCount !== null && Number.isFinite(pageCount) ? pageCount : 1;
    const gate = await assertCanRunAiPlus({
      userId: user.id,
      toolSlug,
      pageCount: pages,
      fileSizeBytes: fileSize,
      isPremium,
    });
    if (!gate.ok) {
      return Response.json({ error: gate.code, message: gate.message }, { status: gate.status });
    }
    if (gate.useTrial) {
      const aiSlot = await reserveAiTrialSlot(user.id, jobIdForSlot);
      if (!aiSlot.ok) {
        return Response.json({ error: aiSlot.code, message: aiSlot.message }, { status: 429 });
      }
      aiOptionExtras.usedTrial = true;
    } else {
      const estimate = estimateAiCredits({
        toolSlug,
        pageCount: pages,
        fileSizeBytes: fileSize,
        isPremium,
      });
      const hold = await reserveCredits(user.id, jobIdForSlot, gate.estimateHigh, isPremium, {
        toolSlug,
        estimate: estimate.estimate,
      });
      if (!hold.ok) {
        return Response.json({ error: hold.code, message: hold.message }, { status: 402 });
      }
      aiOptionExtras.creditHoldAmount = gate.estimateHigh;
      aiOptionExtras.isPremium = isPremium;
    }
  }

  const slot = await reserveEnhancedJobSlot(user.id, jobIdForSlot, isPremium);
  if (!slot.ok) {
    return Response.json({ error: slot.code, message: slot.message }, { status: 429 });
  }

  const traceId =
    typeof body.traceId === "string" && body.traceId.trim() ? body.traceId.trim() : undefined;

  const job = await createProcessingJob({
    userId: user.id,
    toolSlug,
    inputR2Key,
    fileSizeBytes: fileSize,
    pages: pageCount !== null && Number.isFinite(pageCount) ? pageCount : null,
    workerPool: pool,
    jobId: jobIdForSlot,
    traceId,
  });

  const jobTraceId = (job as { trace_id?: string }).trace_id ?? traceId ?? job.id;

  await appendJobTraceEvent({
    jobId: job.id,
    traceId: jobTraceId,
    stage: "enqueue",
    message: `pool=${pool}`,
    meta: { toolSlug, inputR2Key },
  });

  logQueueEvent("enqueue_start", {
    toolSlug,
    jobId: job.id,
    pool,
    traceId: jobTraceId,
    inputR2Key,
    queueDepthBefore: depth,
  });

  const mergedOptions: Record<string, unknown> = {
    ...(jobOptions ?? {}),
    toolSlug,
    ...aiOptionExtras,
  };
  const scale = assessDocumentScale({
    toolSlug,
    fileSizeBytes: fileSize,
    pageCount,
    path: "advanced",
    isPremium,
  });
  if (scale.batched && scale.pageBatches.length > 0) {
    mergedOptions.pageBatches = scale.pageBatches;
    mergedOptions.batchedProcessing = true;
  }
  try {
    const traceData = Sentry.getTraceData();
    if (traceData && Object.keys(traceData).length > 0) {
      mergedOptions._sentryTrace = traceData;
    }
  } catch {
    /* optional trace propagation */
  }
  const workersPriorityQueues = envString("WORKERS_PRIORITY_QUEUES", "false") === "true";
  const queuePriority = isPremium && workersPriorityQueues ? "premium" : "default";
  const queued = await enqueueJob(pool, job.id, inputR2Key, mergedOptions, jobTraceId, queuePriority);
  if (!queued) {
    logQueueEvent("enqueue_failed", { toolSlug, jobId: job.id, pool, reason: "lpush_failed" });
    await failProcessingJob(job.id, user.id, "queue_unavailable", "Job queue is unavailable.");
    return Response.json({ error: "queue_unavailable", message: "Job queue is unavailable." }, { status: 503 });
  }

  const depthAfter = await getQueueDepth(pool);
  logQueueEvent("enqueue_ok", {
    toolSlug,
    jobId: job.id,
    pool,
    traceId: jobTraceId,
    queueDepthAfter: depthAfter,
  });

  await recordEnhancedIpQuota(ip);

  if (pool === "ai") {
    after(() => kickAiQueueAfterEnqueue());
  }

  return Response.json({
    jobId: job.id,
    traceId: jobTraceId,
    status: job.status,
    workerPool: pool,
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "enqueue_failed";
    console.error("[enhanced/jobs] POST failed:", err);
    captureApiException(err, {
      api_name: "enhanced_jobs",
      pipeline_stage: "enqueue",
    });
    logQueueEvent("enqueue_exception", { message });
    return Response.json(
      { error: "enqueue_failed", message: message || "Could not queue cloud job. Check server logs." },
      { status: 500 },
    );
  }
}

export const POST = withSentryRoute("enhanced_jobs", postJobs);
