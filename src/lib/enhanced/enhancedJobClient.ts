import type { EnhancedJobResponse, EnhancedUsageResponse } from "@/lib/enhanced/types";
import { logApiError } from "@/utils/logger";
import { inferUploadContentType } from "@/lib/enhanced/inferUploadContentType";
export class EnhancedJobError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "EnhancedJobError";
    this.code = code;
  }
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) {
    throw new EnhancedJobError(
      "empty_response",
      `Server returned HTTP ${res.status} with no body. Cloud processing may be temporarily unavailable — try again shortly.`,
    );
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new EnhancedJobError(
      "invalid_json",
      `Server returned HTTP ${res.status} with invalid JSON. ${text.slice(0, 120)}`,
    );
  }
}

function reportApiFailure(
  url: string,
  method: string,
  phase: string,
  error: unknown,
  opts?: { tool_slug?: string; statusCode?: number },
) {
  logApiError({
    url,
    method,
    phase,
    tool_slug: opts?.tool_slug,
    statusCode: opts?.statusCode,
    error,
  });
}

function throwFromResponse(
  status: number,
  data: { error?: string; message?: string },
  ctx: { url: string; phase: string; tool_slug?: string },
): never {
  const code = typeof data.error === "string" ? data.error : "request_failed";
  const message = data.message ?? code;
  const err =
    status === 429 || code === "DAILY_LIMIT"
      ? new EnhancedJobError("DAILY_LIMIT", message)
        : code === "AI_TRIAL_USED"
        ? new EnhancedJobError("AI_TRIAL_USED", message)
        : code === "INSUFFICIENT_CREDITS"
          ? new EnhancedJobError("INSUFFICIENT_CREDITS", message)
          : new EnhancedJobError(code, message);
  reportApiFailure(ctx.url, "POST", ctx.phase, err, {
    tool_slug: ctx.tool_slug,
    statusCode: status,
  });
  throw err;
}

export async function fetchEnhancedUsage(): Promise<EnhancedUsageResponse> {
  const res = await fetch("/api/enhanced/usage", { credentials: "include" });
  if (!res.ok) {
    return { enabled: false, enhancedRemaining: 0, dailyLimit: 2 };
  }
  return res.json() as Promise<EnhancedUsageResponse>;
}

export type CreditEstimateResponse = {
  toolSlug: string;
  pageCount: number;
  estimate: number;
  estimateHigh: number;
  canProceed: boolean;
  useTrial?: boolean;
  aiTrial?: { trialRemaining: number };
  credits?: { available: number; balance: number; monthlyGrant?: number };
};

export async function fetchCreditEstimate(body: {
  toolSlug: string;
  pageCount?: number;
  totalChars?: number;
  fileSize?: number;
  processingMode?: string;
}): Promise<CreditEstimateResponse> {
  const res = await fetch("/api/credits/estimate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throwFromResponse(res.status, data as { error?: string; message?: string }, {
      url: "/api/credits/estimate",
      phase: "credits_estimate",
      tool_slug: body.toolSlug,
    });
  }
  return data as CreditEstimateResponse;
}

export async function presignEnhancedUpload(
  file: File,
  opts?: { toolSlug?: string; pageCount?: number | null; processingMode?: string },
): Promise<{
  url: string;
  key: string;
  jobId: string;
  traceId: string;
  contentType: string;
}> {
  const contentType = inferUploadContentType(file);
  const res = await fetch("/api/enhanced/presign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType,
      fileSize: file.size,
      toolSlug: opts?.toolSlug,
      pageCount: opts?.pageCount ?? undefined,
      processingMode: opts?.processingMode,
    }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throwFromResponse(
      res.status,
      {
        error: typeof data.error === "string" ? data.error : undefined,
        message: typeof data.message === "string" ? data.message : undefined,
      },
      { url: "/api/enhanced/presign", phase: "presign", tool_slug: opts?.toolSlug },
    );
  }
  return {
    url: String(data.url),
    key: String(data.key),
    jobId: String(data.jobId),
    traceId: typeof data.traceId === "string" ? data.traceId : String(data.jobId),
    contentType: typeof data.contentType === "string" ? data.contentType : contentType,
  };
}

export async function uploadToPresignedUrl(
  url: string,
  file: File,
  contentType: string,
  opts?: { key?: string; toolSlug?: string; processingMode?: string },
): Promise<void> {
  if (opts?.key) {
    await uploadViaSameOriginProxy(opts.key, file, contentType, opts);
    return;
  }

  const put = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) {
    const err = new Error(
      put.status === 0
        ? "Cloud upload blocked (network or CORS). Retrying via secure upload…"
        : `Upload to cloud storage failed (HTTP ${put.status})`,
    );
    reportApiFailure(url.split("?")[0] ?? "/r2-upload", "PUT", "upload", err, {
      statusCode: put.status || undefined,
    });
    if (opts?.key) {
      await uploadViaSameOriginProxy(opts.key, file, contentType, opts);
      return;
    }
    throw err;
  }
}

async function uploadViaSameOriginProxy(
  key: string,
  file: File,
  contentType: string,
  opts?: { toolSlug?: string; processingMode?: string },
): Promise<void> {
  const form = new FormData();
  form.append("key", key);
  form.append("file", file, file.name);
  form.append("contentType", contentType);
  if (opts?.toolSlug) form.append("toolSlug", opts.toolSlug);
  if (opts?.processingMode) form.append("processingMode", opts.processingMode);

  const res = await fetch("/api/enhanced/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    const err = new Error(data.message ?? data.error ?? `Secure upload failed (HTTP ${res.status})`);
    reportApiFailure("/api/enhanced/upload", "POST", "upload_proxy", err, {
      statusCode: res.status,
      tool_slug: opts?.toolSlug,
    });
    throw err;
  }
}

export async function createEnhancedJob(input: {
  toolSlug: string;
  inputR2Key: string;
  fileSize: number;
  pageCount: number | null;
  jobId: string;
  traceId?: string;
  options?: Record<string, unknown>;
}): Promise<{ jobId: string; traceId?: string }> {
  const res = await fetch("/api/enhanced/jobs", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throwFromResponse(
      res.status,
      {
        error: typeof data.error === "string" ? data.error : undefined,
        message: typeof data.message === "string" ? data.message : undefined,
      },
      { url: "/api/enhanced/jobs", phase: "enqueue", tool_slug: input.toolSlug },
    );
  }
  return { jobId: String(data.jobId), traceId: typeof data.traceId === "string" ? data.traceId : undefined };
}

export async function pollEnhancedJob(jobId: string, retries = 3): Promise<EnhancedJobResponse> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(`/api/enhanced/jobs/${jobId}`, { credentials: "include" });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        const err = new Error(
          (typeof data.message === "string" ? data.message : undefined) ??
            (typeof data.error === "string" ? data.error : undefined) ??
            "Job status unavailable",
        );
        if (res.status >= 500 && attempt < retries) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        reportApiFailure(`/api/enhanced/jobs/${jobId}`, "GET", "poll", err, {
          statusCode: res.status,
        });
        throw err;
      }
      return data as unknown as EnhancedJobResponse;
    } catch (e) {
      lastErr = e;
      if (attempt < retries && e instanceof TypeError) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Job poll failed");
}
