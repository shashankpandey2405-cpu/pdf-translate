import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getRedis } from "@/server/enhanced/redis";
import { isServerQaBypassActive } from "@/server/qa/isQaMode";

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function utcMonthStart(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

async function claimIdempotency(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;
  const claimed = await redis.set(key, "1", { nx: true, ex: 86400 * 7 });
  return Boolean(claimed);
}

async function bumpMonthlyAndLifetime(
  userId: string,
  kind: "cloud" | "browser",
  toolSlug: string,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const month = utcMonthStart();
  const cloudInc = kind === "cloud" ? 1 : 0;
  const browserInc = kind === "browser" ? 1 : 0;

  const { error: monthlyRpc } = await admin.rpc("increment_usage_monthly", {
    p_user_id: userId,
    p_month: month,
    p_browser: browserInc,
    p_cloud: cloudInc,
  });
  if (monthlyRpc) {
    const { data: monthly } = await admin
      .from("user_usage_monthly")
      .select("browser_used, cloud_used")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();
    if (!monthly) {
      await admin.from("user_usage_monthly").insert({
        user_id: userId,
        month,
        browser_used: browserInc,
        cloud_used: cloudInc,
      });
    } else {
      await admin
        .from("user_usage_monthly")
        .update({
          browser_used: (monthly.browser_used ?? 0) + browserInc,
          cloud_used: (monthly.cloud_used ?? 0) + cloudInc,
        })
        .eq("user_id", userId)
        .eq("month", month);
    }
  }

  const { error: totalsRpc } = await admin.rpc("increment_usage_totals", {
    p_user_id: userId,
    p_browser: browserInc,
    p_cloud: cloudInc,
    p_jobs: 1,
  });
  if (totalsRpc) {
    const { data: totals } = await admin
      .from("user_usage_totals")
      .select("lifetime_browser, lifetime_cloud, lifetime_jobs")
      .eq("user_id", userId)
      .maybeSingle();
    if (!totals) {
      await admin.from("user_usage_totals").insert({
        user_id: userId,
        lifetime_browser: browserInc,
        lifetime_cloud: cloudInc,
        lifetime_jobs: 1,
      });
    } else {
      await admin
        .from("user_usage_totals")
        .update({
          lifetime_browser: (totals.lifetime_browser ?? 0) + browserInc,
          lifetime_cloud: (totals.lifetime_cloud ?? 0) + cloudInc,
          lifetime_jobs: (totals.lifetime_jobs ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }
  }

  if (kind === "cloud" && toolSlug === "ocr-pdf") {
    const date = utcDateString();
    const { data: daily } = await admin
      .from("user_usage")
      .select("ocr_used")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (daily) {
      await admin
        .from("user_usage")
        .update({ ocr_used: (daily.ocr_used ?? 0) + 1 })
        .eq("user_id", userId)
        .eq("date", date);
    }
  }
}

async function bumpRollups(
  userId: string,
  kind: "cloud" | "browser",
  toolSlug: string,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const date = utcDateString();
  const month = utcMonthStart();

  const { data: daily } = await admin
    .from("user_usage")
    .select("enhanced_used, browser_used, cloud_used, ocr_used")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  const cloudInc = kind === "cloud" ? 1 : 0;
  const browserInc = kind === "browser" ? 1 : 0;
  const ocrInc = kind === "cloud" && toolSlug === "ocr-pdf" ? 1 : 0;

  if (!daily) {
    await admin.from("user_usage").insert({
      user_id: userId,
      date,
      enhanced_used: cloudInc,
      cloud_used: cloudInc,
      browser_used: browserInc,
      ocr_used: ocrInc,
    });
  } else {
    await admin
      .from("user_usage")
      .update({
        enhanced_used: (daily.enhanced_used ?? 0) + cloudInc,
        cloud_used: (daily.cloud_used ?? 0) + cloudInc,
        browser_used: (daily.browser_used ?? 0) + browserInc,
        ocr_used: (daily.ocr_used ?? 0) + ocrInc,
      })
      .eq("user_id", userId)
      .eq("date", date);
  }

  const { data: monthly } = await admin
    .from("user_usage_monthly")
    .select("browser_used, cloud_used")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  if (!monthly) {
    await admin.from("user_usage_monthly").insert({
      user_id: userId,
      month,
      browser_used: browserInc,
      cloud_used: cloudInc,
    });
  } else {
    await admin
      .from("user_usage_monthly")
      .update({
        browser_used: (monthly.browser_used ?? 0) + browserInc,
        cloud_used: (monthly.cloud_used ?? 0) + cloudInc,
      })
      .eq("user_id", userId)
      .eq("month", month);
  }

  const { data: totals } = await admin
    .from("user_usage_totals")
    .select("lifetime_browser, lifetime_cloud, lifetime_jobs")
    .eq("user_id", userId)
    .maybeSingle();

  if (!totals) {
    await admin.from("user_usage_totals").insert({
      user_id: userId,
      lifetime_browser: browserInc,
      lifetime_cloud: cloudInc,
      lifetime_jobs: 1,
    });
  } else {
    await admin
      .from("user_usage_totals")
      .update({
        lifetime_browser: (totals.lifetime_browser ?? 0) + browserInc,
        lifetime_cloud: (totals.lifetime_cloud ?? 0) + cloudInc,
        lifetime_jobs: (totals.lifetime_jobs ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }
}

/** Idempotent completion rollup for cloud jobs (monthly/lifetime; daily quota reserved at enqueue). */
export async function recordCloudJobCompleted(
  userId: string,
  toolSlug: string,
  jobId: string,
): Promise<void> {
  if (isServerQaBypassActive()) return;
  const key = `usage:recorded:cloud:${jobId}`;
  if (!(await claimIdempotency(key))) return;
  await bumpRollups(userId, "cloud", toolSlug);
}

/** Browser job completion (client POST after success). */
export async function recordBrowserJobCompleted(
  userId: string,
  toolSlug: string,
  sessionId: string,
): Promise<void> {
  if (isServerQaBypassActive()) return;
  const key = `usage:recorded:browser:${userId}:${toolSlug}:${sessionId}`;
  if (!(await claimIdempotency(key))) return;
  await bumpRollups(userId, "browser", toolSlug);
}

export type FullUsageSnapshot = {
  daily: {
    cloudUsed: number;
    browserUsed: number;
    cloudLimit: number;
    cloudRemaining: number;
    resetsAt: string;
  };
  monthly: { cloudUsed: number; browserUsed: number };
  lifetime: { cloudUsed: number; browserUsed: number };
  /** Legacy fields */
  enhancedUsed: number;
  enhancedRemaining: number;
  dailyLimit: number;
  resetsAt: string;
};

export async function getFullUsageSnapshot(
  userId: string,
  cloudLimit: number,
): Promise<FullUsageSnapshot> {
  const admin = createSupabaseAdmin();
  const date = utcDateString();
  const month = utcMonthStart();

  const [{ data: daily }, { data: monthly }, { data: totals }] = await Promise.all([
    admin.from("user_usage").select("enhanced_used, browser_used, cloud_used").eq("user_id", userId).eq("date", date).maybeSingle(),
    admin.from("user_usage_monthly").select("browser_used, cloud_used").eq("user_id", userId).eq("month", month).maybeSingle(),
    admin.from("user_usage_totals").select("lifetime_browser, lifetime_cloud").eq("user_id", userId).maybeSingle(),
  ]);

  const cloudUsed = daily?.cloud_used ?? daily?.enhanced_used ?? 0;
  const browserUsed = daily?.browser_used ?? 0;
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return {
    daily: {
      cloudUsed,
      browserUsed,
      cloudLimit,
      cloudRemaining: Math.max(0, cloudLimit - cloudUsed),
      resetsAt: tomorrow.toISOString(),
    },
    monthly: {
      cloudUsed: monthly?.cloud_used ?? 0,
      browserUsed: monthly?.browser_used ?? 0,
    },
    lifetime: {
      cloudUsed: totals?.lifetime_cloud ?? 0,
      browserUsed: totals?.lifetime_browser ?? 0,
    },
    enhancedUsed: cloudUsed,
    enhancedRemaining: Math.max(0, cloudLimit - cloudUsed),
    dailyLimit: cloudLimit,
    resetsAt: tomorrow.toISOString(),
  };
}
