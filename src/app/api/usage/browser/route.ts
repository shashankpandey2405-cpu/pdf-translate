import { requireApiUser } from "@/server/enhanced/auth";
import { peekLocalProcessRateLimit, recordLocalProcessRateLimit } from "@/server/enhanced/rateLimits";
import { recordBrowserJobCompleted } from "@/server/usage/recordUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const peek = await peekLocalProcessRateLimit({ isSignedIn: true, userId: user.id, ip });
  if (!peek.allowed) {
    return Response.json({ error: "RATE_LIMIT", message: peek.reason }, { status: 429 });
  }

  let body: { toolSlug?: unknown; sessionId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!toolSlug || !sessionId) {
    return Response.json({ error: "invalid_request", message: "toolSlug and sessionId required" }, { status: 400 });
  }

  await recordLocalProcessRateLimit({ isSignedIn: true, userId: user.id, ip });
  await recordBrowserJobCompleted(user.id, toolSlug, sessionId);
  return Response.json({ ok: true });
}
