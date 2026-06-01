import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { peekLocalProcessRateLimit } from "@/server/enhanced/rateLimits";
import { runApiGuard } from "@/server/security/apiGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "local_rate", ipHourlyMax: 200 });
  if (guard) return guard;

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        userId = null;
      } else {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
      }
    } catch {
      userId = null;
    }
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const check = await peekLocalProcessRateLimit({
    isSignedIn: Boolean(userId),
    userId,
    ip,
  });

  if (!check.allowed) {
    return Response.json({ allowed: false, reason: check.reason }, { status: 429 });
  }
  return Response.json({ allowed: true });
}
