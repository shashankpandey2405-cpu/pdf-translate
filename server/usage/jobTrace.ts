import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseAdminOrNull } from "@/lib/supabase/admin";

export type JobTraceStage =
  | "presign"
  | "enqueue"
  | "redis_pop"
  | "r2_download"
  | "process"
  | "r2_upload"
  | "callback"
  | "supabase_update";

export async function appendJobTraceEvent(input: {
  jobId?: string | null;
  traceId: string;
  stage: JobTraceStage;
  status?: "ok" | "error";
  message?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const admin = getSupabaseAdminOrNull();
  if (!admin) return;
  try {
    await admin.from("job_trace_events").insert({
      job_id: input.jobId ?? null,
      trace_id: input.traceId,
      stage: input.stage,
      status: input.status ?? "ok",
      message: input.message?.slice(0, 500) ?? null,
      meta: input.meta ?? null,
    });
  } catch (err) {
    console.error("[jobTrace] insert failed:", err);
  }
}

export async function getJobTraceTimeline(traceId: string) {
  const admin = createSupabaseAdmin();
  const { data: events } = await admin
    .from("job_trace_events")
    .select("*")
    .eq("trace_id", traceId)
    .order("created_at", { ascending: true });

  const { data: job } = await admin
    .from("processing_jobs")
    .select("*")
    .eq("trace_id", traceId)
    .maybeSingle();

  return { job, events: events ?? [] };
}
