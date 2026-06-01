import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isQaSecretValid } from "@/server/qa/isQaMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Internal: recent failed/stuck jobs for QA ops dashboard. */
export async function GET(req: Request) {
  if (!isQaSecretValid(req)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { data: failed } = await admin
    .from("processing_jobs")
    .select("id, tool_slug, status, error_code, error_message, created_at, finished_at")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(5);

  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: stuck } = await admin
    .from("processing_jobs")
    .select("id, tool_slug, status, created_at, started_at")
    .in("status", ["queued", "processing"])
    .lt("created_at", staleBefore)
    .order("created_at", { ascending: false })
    .limit(5);

  return Response.json({
    failed: failed ?? [],
    stuck: stuck ?? [],
    qaMode: true,
  });
}
