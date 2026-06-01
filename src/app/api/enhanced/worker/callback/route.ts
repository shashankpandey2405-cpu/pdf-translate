import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { VALID_JOB_STATUSES, type JobStatus } from "@/server/enhanced/config";
import { appendJobTraceEvent } from "@/server/usage/jobTrace";
import { recordCloudJobCompleted } from "@/server/usage/recordUsage";
import { authorizeWorkerRequest } from "@/server/workerAuth";
import { releaseCreditHold, settleCreditHold } from "@/server/credits/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TERMINAL: JobStatus[] = ["done", "failed", "cancelled"];
const ALLOWED_TRANSITIONS: Record<string, JobStatus[]> = {
  queued: ["processing", "failed", "cancelled"],
  processing: ["done", "failed", "cancelled"],
  done: [],
  failed: [],
  cancelled: [],
};

async function postWorkerCallback(req: Request) {
  let body: {
    jobId?: string;
    status?: string;
    outputR2Key?: string;
    errorCode?: string;
    errorMessage?: string;
    progress?: number;
    traceId?: string;
    traceEvents?: Array<{ stage?: string; status?: string; message?: string }>;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!jobId || !status) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!authorizeWorkerRequest(req, jobId, status, body.outputR2Key)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  if (!VALID_JOB_STATUSES.includes(status as JobStatus)) {
    return Response.json({ error: "invalid_status", message: `Unknown status: ${status}` }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: existing } = await admin
    .from("processing_jobs")
    .select("id, user_id, tool_slug, trace_id, status")
    .eq("id", jobId)
    .maybeSingle();
  if (!existing) {
    return Response.json({ error: "not_found", message: "Job not found." }, { status: 404 });
  }

  const currentStatus = (existing.status as JobStatus) ?? "queued";
  if (TERMINAL.includes(currentStatus) && currentStatus !== status) {
    return Response.json({ ok: true, skipped: "already_terminal" });
  }
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (currentStatus !== status && !allowed.includes(status as JobStatus)) {
    return Response.json(
      { error: "invalid_transition", message: `Cannot move ${currentStatus} → ${status}` },
      { status: 409 },
    );
  }

  if (body.outputR2Key) {
    const expectedPrefix = `enhanced/output/${existing.user_id}/`;
    if (!body.outputR2Key.startsWith(expectedPrefix)) {
      return Response.json(
        { error: "invalid_output_key", message: "Output key does not match job owner." },
        { status: 400 },
      );
    }
  }

  const patch: Record<string, unknown> = {
    status,
    progress: typeof body.progress === "number" ? body.progress : status === "done" ? 100 : 0,
  };
  if (body.outputR2Key) patch.output_r2_key = body.outputR2Key;
  if (body.errorCode) patch.error_code = body.errorCode;
  if (body.errorMessage) patch.error_message = body.errorMessage;
  if (status === "processing") patch.started_at = new Date().toISOString();
  if (status === "done" || status === "failed") patch.finished_at = new Date().toISOString();

  const traceId =
    (typeof body.traceId === "string" && body.traceId) ||
    (existing.trace_id as string | undefined) ||
    jobId;

  await appendJobTraceEvent({
    jobId,
    traceId,
    stage: "callback",
    status: status === "failed" ? "error" : "ok",
    message: body.errorMessage?.slice(0, 200) ?? status,
  });

  const { error } = await admin
    .from("processing_jobs")
    .update(patch)
    .eq("id", jobId)
    .in("status", currentStatus === status ? [currentStatus] : [currentStatus]);
  if (error) {
    await appendJobTraceEvent({
      jobId,
      traceId,
      stage: "supabase_update",
      status: "error",
      message: error.message,
    });
    return Response.json({ error: error.message }, { status: 500 });
  }

  await appendJobTraceEvent({
    jobId,
    traceId,
    stage: "supabase_update",
    status: "ok",
    message: status,
  });

  if (status === "done" && existing.user_id && existing.tool_slug) {
    await recordCloudJobCompleted(existing.user_id, existing.tool_slug, jobId);
    try {
      await settleCreditHold(jobId, 1);
    } catch {
      /* no credit hold for this job */
    }
  }

  if (status === "failed" || status === "cancelled") {
    await releaseCreditHold(jobId);
  }

  if (Array.isArray(body.traceEvents)) {
    for (const ev of body.traceEvents.slice(0, 20)) {
      if (!ev?.stage) continue;
      await appendJobTraceEvent({
        jobId,
        traceId,
        stage: ev.stage as "process",
        status: ev.status === "error" ? "error" : "ok",
        message: ev.message,
      });
    }
  }

  return Response.json({ ok: true });
}

export const POST = withSentryRoute("enhanced_worker_callback", postWorkerCallback);
