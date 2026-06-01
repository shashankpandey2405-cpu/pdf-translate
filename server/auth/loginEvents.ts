import { createHash } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function hashIp(ip: string): string | null {
  const trimmed = ip.trim();
  if (!trimmed || trimmed === "unknown") return null;
  return createHash("sha256").update(trimmed).digest("hex");
}

export async function recordLoginEvent(
  userId: string,
  req: Request,
  provider = "google",
): Promise<void> {
  try {
    const admin = createSupabaseAdmin();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;
    await admin.from("login_events").insert({
      user_id: userId,
      provider,
      ip_hash: hashIp(ip),
      user_agent: userAgent,
    });
  } catch (err) {
    console.error("[loginEvents] failed to record:", err);
  }
}
