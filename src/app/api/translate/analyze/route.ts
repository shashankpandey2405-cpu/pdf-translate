import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { getObjectBytes } from "@/server/s3Objects";
import { analyzePdfBytes } from "@/server/translate/analyzer";
import { isClassicMtConfigured } from "@/server/translate/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postAnalyze(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "translate_analyze", ipHourlyMax: 60 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: { inputR2Key?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const inputR2Key = typeof body.inputR2Key === "string" ? body.inputR2Key : "";
  if (!inputR2Key.startsWith(`enhanced/input/${user.id}/`)) {
    return Response.json({ error: "invalid_key" }, { status: 403 });
  }

  try {
    const bytes = await getObjectBytes(inputR2Key);
    const analysis = await analyzePdfBytes(bytes);
    return Response.json({
      ok: true,
      ...analysis,
      classicMtAvailable: isClassicMtConfigured(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "analyze_failed";
    return Response.json({ error: "analyze_failed", message: msg }, { status: 400 });
  }
}

export const POST = withSentryRoute("translate_analyze", postAnalyze);
