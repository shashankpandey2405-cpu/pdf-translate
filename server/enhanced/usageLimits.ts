import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCreditBalance } from "@/server/credits/ledger";
import { ENHANCED_DAILY_LIMIT } from "@/server/enhanced/config";
import { getRedis } from "@/server/enhanced/redis";
import { isUnlimitedEnhancedUser, UNLIMITED_USAGE_SNAPSHOT } from "@/server/enhanced/unlimitedUsers";
import { isServerQaBypassActive, QA_USAGE_SNAPSHOT } from "@/server/qa/isQaMode";
import { getFullUsageSnapshot, type FullUsageSnapshot } from "@/server/usage/recordUsage";

export type { FullUsageSnapshot };

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export type UsageSnapshot = {
  enhancedUsed: number;
  enhancedRemaining: number;
  dailyLimit: number;
  resetsAt: string;
};

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  if (isServerQaBypassActive() || isUnlimitedEnhancedUser(userId)) {
    return isUnlimitedEnhancedUser(userId) ? { ...UNLIMITED_USAGE_SNAPSHOT } : { ...QA_USAGE_SNAPSHOT };
  }
  const full = await getFullUsageSnapshot(userId, ENHANCED_DAILY_LIMIT);
  return {
    enhancedUsed: full.enhancedUsed,
    enhancedRemaining: full.enhancedRemaining,
    dailyLimit: full.dailyLimit,
    resetsAt: full.resetsAt,
  };
}

export async function getUsageSnapshotFull(userId: string): Promise<FullUsageSnapshot> {
  if (isServerQaBypassActive() || isUnlimitedEnhancedUser(userId)) {
    const snap = isUnlimitedEnhancedUser(userId) ? { ...UNLIMITED_USAGE_SNAPSHOT } : { ...QA_USAGE_SNAPSHOT };
    return {
      daily: {
        cloudUsed: snap.enhancedUsed,
        browserUsed: 0,
        cloudLimit: snap.dailyLimit,
        cloudRemaining: snap.enhancedRemaining,
        resetsAt: snap.resetsAt,
      },
      monthly: { cloudUsed: 0, browserUsed: 0 },
      lifetime: { cloudUsed: 0, browserUsed: 0 },
      ...snap,
    };
  }
  return getFullUsageSnapshot(userId, ENHANCED_DAILY_LIMIT);
}

export async function assertCanStartEnhancedJob(userId: string, isPremium = false): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (isServerQaBypassActive() || isUnlimitedEnhancedUser(userId) || isPremium) {
    return { ok: true };
  }
  const credits = await getCreditBalance(userId, false);
  if (credits.available < 1) {
    return {
      ok: false,
      code: "INSUFFICIENT_CREDITS",
      message: `Need at least 1 credit to start cloud processing (you have ${credits.available} available). Credits refresh monthly.`,
    };
  }
  return { ok: true };
}

/**
 * Atomically reserves a daily Premium slot (Redis INCR when available) then records usage in Supabase.
 * Call once per job enqueue instead of assertCanStartEnhancedJob + incrementEnhancedUsage separately.
 */
export async function reserveEnhancedJobSlot(
  userId: string,
  jobId: string,
  isPremium = false,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (isServerQaBypassActive() || isUnlimitedEnhancedUser(userId) || isPremium) {
    return { ok: true };
  }

  // Free tier quota is enforced via credit holds at enqueue; daily rollups happen on job completion.
  return { ok: true };
}

/** Idempotent increment when job is enqueued. */
export async function incrementEnhancedUsage(userId: string, jobId: string): Promise<void> {
  if (isServerQaBypassActive() || isUnlimitedEnhancedUser(userId)) {
    return;
  }
  const date = utcDateString();
  const admin = createSupabaseAdmin();
  const idempotencyKey = `enhanced:usage:${userId}:${date}:${jobId}`;
  const redis = getRedis();
  if (redis) {
    const claimed = await redis.set(idempotencyKey, "1", { nx: true, ex: 86400 });
    if (!claimed) return;
  }

  const { data: existing } = await admin
    .from("user_usage")
    .select("enhanced_used, cloud_used, ocr_used")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (!existing) {
    await admin.from("user_usage").insert({
      user_id: userId,
      date,
      enhanced_used: 1,
      cloud_used: 1,
      browser_used: 0,
      ocr_used: 0,
    });
    return;
  }

  await admin
    .from("user_usage")
    .update({
      enhanced_used: (existing.enhanced_used ?? 0) + 1,
      cloud_used: (existing.cloud_used ?? 0) + 1,
    })
    .eq("user_id", userId)
    .eq("date", date);
}
