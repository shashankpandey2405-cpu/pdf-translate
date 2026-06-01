import { envString } from "@/server/env";
import { isServerQaBypassActive } from "@/server/qa/isQaMode";
import { rateLimitIncrWithFallback } from "@/server/security/apiBurstLimit";

function presignHourlyMax(isPremium: boolean): number {
  if (isPremium) return 100;
  const n = Number(envString("ENHANCED_PRESIGN_HOURLY_LIMIT", "8"));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 8;
}

function presignDailyMax(isPremium: boolean): number {
  if (isPremium) return 500;
  const n = Number(envString("ENHANCED_PRESIGN_DAILY_LIMIT", "25"));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 25;
}

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Prevents presign URL farming without consuming a job slot.
 * Real quota is still enforced on job enqueue via reserveEnhancedJobSlot.
 * Premium users get much higher rate limits.
 */
export async function assertPresignRateLimit(
  userId: string,
  isPremium = false,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isServerQaBypassActive()) return { ok: true };

  const date = utcDateString();
  const hourKey = `presign:hour:${userId}:${new Date().toISOString().slice(0, 13)}`;
  const dayKey = `presign:day:${userId}:${date}`;

  const hourCheck = await rateLimitIncrWithFallback(hourKey, presignHourlyMax(isPremium), 3600);
  if (!hourCheck.ok) {
    return {
      ok: false,
      message: "Too many upload attempts this hour. Finish a job or try again later.",
    };
  }

  const dayCheck = await rateLimitIncrWithFallback(dayKey, presignDailyMax(isPremium), 86400);
  if (!dayCheck.ok) {
    return {
      ok: false,
      message: isPremium
        ? "Daily upload limit reached. Try again tomorrow."
        : "Upload limit reached. Upgrade to Premium or use browser-based tools.",
    };
  }

  return { ok: true };
}
