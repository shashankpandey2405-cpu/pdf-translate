import { envString } from "@/server/env";
import { getJobTraceTimeline } from "@/server/usage/jobTrace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = envString("PDFTRUSTED_QA_SECRET");
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}` || req.headers.get("x-qa-secret") === secret;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && !authorized(req)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const traceId = new URL(req.url).searchParams.get("traceId")?.trim();
  if (!traceId) {
    return Response.json({ error: "traceId required" }, { status: 400 });
  }

  try {
    const timeline = await getJobTraceTimeline(traceId);
    return Response.json(timeline);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "lookup_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
