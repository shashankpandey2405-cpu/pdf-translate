import { requireApiUser } from "@/server/enhanced/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { isEnhancedInfraConfigured } from "@/server/enhanced/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isEnhancedInfraConfigured()) {
    return Response.json({ jobs: [] });
  }

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("processing_jobs")
    .select("id, tool_slug, status, created_at, finished_at, file_size_bytes, pages, error_message")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return Response.json({ error: "fetch_failed", message: error.message }, { status: 500 });
  }

  return Response.json({ jobs: data ?? [] });
}
