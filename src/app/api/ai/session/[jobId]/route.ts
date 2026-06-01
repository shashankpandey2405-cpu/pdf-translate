import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { getAiSession } from "@/server/ai/sessionStore";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getSession(req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const guard = await runApiGuard(req, { burstBucket: "ai_session", ipHourlyMax: 120 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const { jobId } = await ctx.params;
  if (!jobId) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: job } = await admin
    .from("processing_jobs")
    .select("id, user_id, status, output_r2_key")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!job) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const session = await getAiSession(jobId);
  if (!session) {
    return Response.json(
      { error: "session_pending", status: job.status, message: "Summary session not ready yet." },
      { status: 202 },
    );
  }

  return Response.json({
    ok: true,
    status: job.status,
    outputR2Key: job.output_r2_key,
    session: {
      summaryText: session.summaryText,
      documentExcerpt: session.documentExcerpt,
      suggestedQuestions: session.suggestedQuestions,
      documentHighlights: session.documentHighlights ?? [],
      suggestedActions: session.suggestedActions ?? [],
      readMethod: session.readMethod ?? "text",
      aiTier: session.aiTier,
      length: session.length,
      outputLang: session.outputLang,
    },
  });
}

export const GET = withSentryRoute("ai_session_get", (req, ctx) => getSession(req, ctx as any));
