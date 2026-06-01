import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { rateLimitIncrWithFallback } from "@/server/security/apiBurstLimit";
import { getClientIp } from "@/server/security/botGuard";
import { sniffUploadKind } from "@/server/security/fileMagic";
import { putObjectBytes } from "@/server/s3Objects";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 2000;
const MAX_SCREENSHOT_URL = 2048;

function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim()
    .slice(0, MAX_TEXT);
}

function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const u = input.trim().slice(0, MAX_SCREENSHOT_URL);
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "feedback", ipHourlyMax: 20 });
  if (guard) return guard;

  const ip = getClientIp(req);
  const hourly = await rateLimitIncrWithFallback(`feedback:ip:${ip}`, 3, 3600);
  if (!hourly.ok) {
    return Response.json({ error: "rate_limit", message: hourly.message }, { status: 429 });
  }

  let body: {
    rating?: unknown;
    feedbackText?: unknown;
    screenshotUrl?: unknown;
    toolName?: unknown;
    pageUrl?: unknown;
    deviceInfo?: unknown;
    screenshotBase64?: unknown;
    screenshotMime?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return Response.json({ error: "invalid_rating", message: "Rating must be 1–10." }, { status: 400 });
  }

  const toolName =
    typeof body.toolName === "string" ? body.toolName.trim().slice(0, 120) : "unknown";
  const dailyTool = await rateLimitIncrWithFallback(`feedback:tool:${ip}:${toolName}`, 1, 86400);
  if (!dailyTool.ok) {
    return Response.json(
      { error: "duplicate_feedback", message: "Thanks — you already shared feedback for this tool today." },
      { status: 429 },
    );
  }

  const feedbackText = sanitizeText(body.feedbackText);
  const screenshotUrl = sanitizeUrl(body.screenshotUrl);
  const pageUrl =
    typeof body.pageUrl === "string" ? body.pageUrl.trim().slice(0, 512) : null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;
  const deviceInfo =
    body.deviceInfo && typeof body.deviceInfo === "object" && !Array.isArray(body.deviceInfo)
      ? body.deviceInfo
      : {};

  let userId: string | null = null;
  const user = await requireApiUser();
  if (!(user instanceof Response)) {
    userId = user.id;
  }

  let storedScreenshotUrl = screenshotUrl;
  if (typeof body.screenshotBase64 === "string" && body.screenshotBase64.length > 0) {
    try {
      const raw = Buffer.from(body.screenshotBase64, "base64");
      if (raw.length <= 2 * 1024 * 1024 && sniffUploadKind(new Uint8Array(raw))) {
        const mime =
          typeof body.screenshotMime === "string" && body.screenshotMime.startsWith("image/")
            ? body.screenshotMime.split(";")[0]!
            : "image/jpeg";
        const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
        const key = `feedback/${randomUUID()}.${ext}`;
        await putObjectBytes(key, new Uint8Array(raw), mime);
        storedScreenshotUrl = key;
      }
    } catch {
      /* optional screenshot — ignore upload failure */
    }
  }

  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("user_feedback").insert({
      user_id: userId,
      rating: Math.round(rating),
      feedback_text: feedbackText || null,
      screenshot_url: storedScreenshotUrl,
      tool_name: toolName,
      page_url: pageUrl,
      user_agent: userAgent,
      device_info: deviceInfo,
      status: "new",
    });
    if (error) {
      console.error("[feedback] insert failed:", error.message);
      return Response.json({ error: "store_failed", message: "Could not save feedback." }, { status: 503 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[feedback] error:", e);
    return Response.json({ error: "store_failed", message: "Could not save feedback." }, { status: 503 });
  }
}
