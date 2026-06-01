import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { getAppEnv } from "@/server/types";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import { requireApiUser } from "@/server/enhanced/auth";
import {
  enhancedMaxFileBytesForTool,
  enhancedPageLimitForTool,
} from "@/server/enhanced/config";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { isAiConfigured, parseProcessingMode, isAiToolSlug } from "@/server/ai/config";
import { assertCanRunAiPlus } from "@/server/ai/assertAiAccess";
import { inputKeyForJob } from "@/server/enhanced/jobStore";
import { assertCanStartEnhancedJob, getUsageSnapshot } from "@/server/enhanced/usageLimits";
import { assertPresignRateLimit } from "@/server/enhanced/presignLimits";
import { runApiGuard } from "@/server/security/apiGuard";
import { assertRedisReady } from "@/server/enhanced/assertRedisReady";
import { logQueueEvent } from "@/server/enhanced/queueLog";
import { appendJobTraceEvent } from "@/server/usage/jobTrace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postPresign(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "enhanced_presign", ipHourlyMax: 60 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);

  const presignLimit = await assertPresignRateLimit(user.id, isPremium);
  if (!presignLimit.ok) {
    return Response.json({ error: "RATE_LIMIT", message: presignLimit.message }, { status: 429 });
  }

  const quotaCheck = await assertCanStartEnhancedJob(user.id, isPremium);
  if (!quotaCheck.ok) {
    return Response.json({ error: quotaCheck.code, message: quotaCheck.message }, { status: 429 });
  }

  let body: {
    filename?: unknown;
    contentType?: unknown;
    fileSize?: unknown;
    toolSlug?: unknown;
    pageCount?: unknown;
    processingMode?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename : "";
  const size = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
  if (!filename || !Number.isFinite(size) || size <= 0) {
    return Response.json({ error: "invalid_request", message: "filename and fileSize required" }, { status: 400 });
  }
  const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug : "";
  const processingMode = parseProcessingMode(body.processingMode);
  const maxBytes = enhancedMaxFileBytesForTool(toolSlug, processingMode ?? undefined, { isPremium });
  if (size > maxBytes) {
    return Response.json(
      {
        error: "file_too_large",
        message: `Upload limit for this mode is ${Math.round(maxBytes / (1024 * 1024))} MB.`,
      },
      { status: 413 },
    );
  }

  const pageCount =
    body.pageCount === null || body.pageCount === undefined
      ? null
      : typeof body.pageCount === "number"
        ? body.pageCount
        : Number(body.pageCount);
  if (toolSlug && pageCount !== null && Number.isFinite(pageCount)) {
    const pageCap = enhancedPageLimitForTool(toolSlug, processingMode ?? undefined, { isPremium });
    if (pageCount > pageCap) {
      return Response.json(
        {
          error: "too_many_pages",
          message: `Premium processing for this tool supports up to ${pageCap} pages.`,
        },
        { status: 413 },
      );
    }
  }

  if (processingMode === "ai_plus") {
    if (!toolSlug || !isAiToolSlug(toolSlug)) {
      return Response.json(
        { error: "unsupported_tool", message: "AI Plus requires a supported AI tool." },
        { status: 400 },
      );
    }
    if (!isAiConfigured()) {
      return Response.json(
        {
          error: "ai_not_configured",
          message: "AI processing is not configured. Set OPENROUTER_API_KEY on Vercel.",
        },
        { status: 503 },
      );
    }
    const pages =
      pageCount !== null && Number.isFinite(pageCount) ? Math.max(1, Math.floor(pageCount)) : 1;
    const gate = await assertCanRunAiPlus({
      userId: user.id,
      toolSlug,
      pageCount: pages,
      fileSizeBytes: size,
      isPremium,
    });
    if (!gate.ok) {
      return Response.json({ error: gate.code, message: gate.message }, { status: gate.status });
    }
  }

  if (toolSlug) {
    const redisBlock = await assertRedisReady(toolSlug);
    if (redisBlock) return redisBlock;
  }

  if (!hasS3Credentials(env)) {
    return stagingUnavailableResponse();
  }

  const jobId = randomUUID();
  const traceId = randomUUID();
  const key = inputKeyForJob(user.id, jobId, filename);
  const contentType =
    typeof body.contentType === "string" && body.contentType.trim()
      ? body.contentType
      : "application/pdf";

  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 900 },
  );

  const usage = await getUsageSnapshot(user.id);

  logQueueEvent("presign_ok", { toolSlug, jobId, traceId, key, fileSize: size });

  await appendJobTraceEvent({
    jobId,
    traceId,
    stage: "presign",
    message: toolSlug || "presign",
    meta: { key, fileSize: size },
  });

  return Response.json({
    url,
    key,
    bucket,
    method: "PUT",
    jobId,
    traceId,
    contentType,
    maxBytes,
    usage: {
      enhancedRemaining: usage.enhancedRemaining,
      dailyLimit: usage.dailyLimit,
    },
  });
}

export const POST = withSentryRoute("enhanced_presign", postPresign);
