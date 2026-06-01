import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getRedis } from "@/server/enhanced/redis";
import { isServerQaBypassActive } from "@/server/qa/isQaMode";
import { monthlyGrantCredits } from "@/server/credits/calculator";

/** Active holds older than this are released by cron (orphan job / lost callback). */
export const CREDIT_HOLD_TTL_MS = 2 * 60 * 60 * 1000;

const REDIS_HOLD_EXPIRY_INDEX = "credits:holds:expiry";

export type CreditBalance = {
  balance: number;
  reserved: number;
  available: number;
  monthlyGrant: number;
  source: "supabase" | "redis";
};

function monthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

function redisBalanceKey(userId: string): string {
  return `credits:bal:${userId}`;
}

function redisReservedKey(userId: string): string {
  return `credits:reserved:${userId}`;
}

function redisHoldKey(jobId: string): string {
  return `credits:hold:${jobId}`;
}

async function trackRedisHoldExpiry(jobId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.zadd(REDIS_HOLD_EXPIRY_INDEX, {
    score: Date.now() + CREDIT_HOLD_TTL_MS,
    member: jobId,
  });
}

async function clearRedisHoldExpiry(jobId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.zrem(REDIS_HOLD_EXPIRY_INDEX, jobId);
}

function redisGrantKey(userId: string, month: string): string {
  return `credits:grant:${userId}:${month}`;
}

async function ensureRedisMonthlyGrant(userId: string, isPremium: boolean): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const month = monthKey();
  const grantKey = redisGrantKey(userId, month);
  const claimed = await redis.set(grantKey, "1", { nx: true, ex: 86400 * 35 });
  if (!claimed) return;
  const grant = monthlyGrantCredits(isPremium);
  const balKey = redisBalanceKey(userId);
  await redis.incrby(balKey, grant);
}

async function getRedisBalance(userId: string, isPremium: boolean): Promise<CreditBalance> {
  await ensureRedisMonthlyGrant(userId, isPremium);
  const redis = getRedis();
  const grant = monthlyGrantCredits(isPremium);
  if (!redis) {
    return { balance: grant, reserved: 0, available: grant, monthlyGrant: grant, source: "redis" };
  }
  const balance = Number((await redis.get(redisBalanceKey(userId))) ?? grant);
  const reserved = Number((await redis.get(redisReservedKey(userId))) ?? 0);
  const available = Math.max(0, balance - reserved);
  return { balance, reserved, available, monthlyGrant: grant, source: "redis" };
}

async function tablesExist(): Promise<boolean> {
  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("credit_accounts").select("user_id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function ensureSupabaseMonthlyGrant(userId: string, isPremium: boolean): Promise<void> {
  const admin = createSupabaseAdmin();
  const month = monthKey();
  const grant = monthlyGrantCredits(isPremium);
  const { data: existing } = await admin
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "grant")
    .gte("created_at", `${month}-01T00:00:00Z`)
    .limit(1);
  if (existing?.length) return;

  const { data: acct } = await admin
    .from("credit_accounts")
    .select("balance, lifetime_granted")
    .eq("user_id", userId)
    .maybeSingle();

  if (!acct) {
    const { error: insErr } = await admin.from("credit_accounts").insert({
      user_id: userId,
      balance: grant,
      reserved: 0,
      lifetime_granted: grant,
    });
    if (insErr) console.error("[credits] account insert failed:", insErr.message);
    const { error: txErr } = await admin.from("credit_transactions").insert({
      user_id: userId,
      type: "grant",
      amount: grant,
      balance_after: grant,
      meta: { month, tier: isPremium ? "premium" : "free" },
    });
    if (txErr) console.error("[credits] grant tx insert failed:", txErr.message);
    return;
  }

  const nextBal = (acct.balance ?? 0) + grant;
  const { error: updErr } = await admin
    .from("credit_accounts")
    .update({
      balance: nextBal,
      lifetime_granted: (acct.lifetime_granted ?? 0) + grant,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (updErr) console.error("[credits] grant balance update failed:", updErr.message);
  const { error: txErr2 } = await admin.from("credit_transactions").insert({
    user_id: userId,
    type: "grant",
    amount: grant,
    balance_after: nextBal,
    meta: { month, tier: isPremium ? "premium" : "free" },
  });
  if (txErr2) console.error("[credits] grant tx insert failed:", txErr2.message);
}

export async function getCreditBalance(userId: string, isPremium: boolean): Promise<CreditBalance> {
  const grant = monthlyGrantCredits(isPremium);

  if (await tablesExist()) {
    await ensureSupabaseMonthlyGrant(userId, isPremium);
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("credit_accounts")
      .select("balance, reserved")
      .eq("user_id", userId)
      .maybeSingle();
    const balance = data?.balance ?? grant;
    const reserved = data?.reserved ?? 0;
    return {
      balance,
      reserved,
      available: Math.max(0, balance - reserved),
      monthlyGrant: grant,
      source: "supabase",
    };
  }

  if (isServerQaBypassActive()) {
    return { balance: grant, reserved: 0, available: grant, monthlyGrant: grant, source: "redis" };
  }

  return getRedisBalance(userId, isPremium);
}

export async function reserveCredits(
  userId: string,
  jobId: string,
  amount: number,
  isPremium: boolean,
  meta?: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (isServerQaBypassActive()) return { ok: true };
  if (amount <= 0) return { ok: true };

  const bal = await getCreditBalance(userId, isPremium);
  if (bal.available < amount) {
    return {
      ok: false,
      code: "INSUFFICIENT_CREDITS",
      message: isPremium
        ? `Need ${amount} AI credits (you have ${bal.available} available). Add extra credits from Pricing when your balance is low.`
        : `Need ${amount} credits (you have ${bal.available} available). Sign in free accounts receive ${monthlyGrantCredits(false)} credits refreshed each month.`,
    };
  }

  if (await tablesExist()) {
    const admin = createSupabaseAdmin();
    const { data: acct, error: readErr } = await admin
      .from("credit_accounts")
      .select("balance, reserved")
      .eq("user_id", userId)
      .single();
    if (readErr || !acct || acct.balance - acct.reserved < amount) {
      return { ok: false, code: "INSUFFICIENT_CREDITS", message: "Not enough AI credits." };
    }
    const { data: updated, error: updateErr } = await admin
      .from("credit_accounts")
      .update({
        reserved: (acct.reserved ?? 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .gte("balance", (acct.reserved ?? 0) + amount)
      .select("balance, reserved")
      .maybeSingle();
    if (updateErr || !updated) {
      return { ok: false, code: "INSUFFICIENT_CREDITS", message: "Not enough AI credits (concurrent update)." };
    }
    const expiresAt = new Date(Date.now() + CREDIT_HOLD_TTL_MS).toISOString();
    const { error: holdErr } = await admin.from("credit_holds").upsert({
      job_id: jobId,
      user_id: userId,
      amount,
      status: "active",
      meta: meta ?? null,
      expires_at: expiresAt,
    });
    if (holdErr) console.error("[credits] hold upsert failed:", holdErr.message);
    const { error: txErr } = await admin.from("credit_transactions").insert({
      user_id: userId,
      job_id: jobId,
      type: "reserve",
      amount: -amount,
      balance_after: updated.balance,
      meta,
    });
    if (txErr) console.error("[credits] reserve tx insert failed:", txErr.message);
    return { ok: true };
  }

  const redis = getRedis();
  if (!redis) {
    return { ok: false, code: "credits_unavailable", message: "Credit system unavailable." };
  }
  const holdKey = redisHoldKey(jobId);
  const existing = await redis.get(holdKey);
  if (existing) return { ok: true };

  const reservedKey = redisReservedKey(userId);
  const newReserved = await redis.incrby(reservedKey, amount);
  const balance = Number((await redis.get(redisBalanceKey(userId))) ?? monthlyGrantCredits(isPremium));
  if (balance - newReserved < 0) {
    await redis.decrby(reservedKey, amount);
    return { ok: false, code: "INSUFFICIENT_CREDITS", message: "Not enough AI credits." };
  }
  await redis.set(holdKey, JSON.stringify({ userId, amount, meta }), { ex: 86400 * 7 });
  await trackRedisHoldExpiry(jobId);
  return { ok: true };
}

export async function settleCreditHold(
  jobId: string,
  actualCredits: number,
): Promise<void> {
  if (isServerQaBypassActive()) return;

  if (await tablesExist()) {
    const admin = createSupabaseAdmin();
    const { data: hold } = await admin
      .from("credit_holds")
      .select("user_id, amount, status")
      .eq("job_id", jobId)
      .maybeSingle();
    if (!hold || hold.status !== "active") return;

    const charge = Math.min(hold.amount, Math.max(1, actualCredits));
    const refund = hold.amount - charge;
    const { data: acct } = await admin
      .from("credit_accounts")
      .select("balance, reserved")
      .eq("user_id", hold.user_id)
      .single();
    if (!acct) return;

    const nextBal = Math.max(0, acct.balance - charge);
    const nextReserved = Math.max(0, acct.reserved - hold.amount);
    const { error: updErr } = await admin
      .from("credit_accounts")
      .update({ balance: nextBal, reserved: nextReserved, updated_at: new Date().toISOString() })
      .eq("user_id", hold.user_id);
    if (updErr) console.error("[credits] settle balance update failed:", updErr.message);
    const { error: holdErr } = await admin
      .from("credit_holds")
      .update({ status: "settled" })
      .eq("job_id", jobId);
    if (holdErr) console.error("[credits] settle hold update failed:", holdErr.message);
    const { error: txErr } = await admin.from("credit_transactions").insert({
      user_id: hold.user_id,
      job_id: jobId,
      type: "settle",
      amount: -charge,
      balance_after: nextBal,
      meta: { reserved: hold.amount, refund },
    });
    if (txErr) console.error("[credits] settle tx insert failed:", txErr.message);
    return;
  }

  const redis = getRedis();
  if (!redis) return;
  const raw = await redis.get(redisHoldKey(jobId));
  if (!raw) return;
  const hold = JSON.parse(raw) as { userId: string; amount: number };
  const charge = Math.min(hold.amount, Math.max(1, actualCredits));
  await redis.decrby(redisBalanceKey(hold.userId), charge);
  await redis.decrby(redisReservedKey(hold.userId), hold.amount);
  await redis.del(redisHoldKey(jobId));
  await clearRedisHoldExpiry(jobId);
}

export async function releaseCreditHold(jobId: string): Promise<void> {
  if (isServerQaBypassActive()) return;

  if (await tablesExist()) {
    const admin = createSupabaseAdmin();
    const { data: hold } = await admin
      .from("credit_holds")
      .select("user_id, amount, status")
      .eq("job_id", jobId)
      .maybeSingle();
    if (!hold || hold.status !== "active") return;
    const { data: acct } = await admin
      .from("credit_accounts")
      .select("balance, reserved")
      .eq("user_id", hold.user_id)
      .single();
    if (acct) {
      const { error: updErr } = await admin
        .from("credit_accounts")
        .update({
          reserved: Math.max(0, (acct.reserved ?? 0) - hold.amount),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", hold.user_id);
      if (updErr) console.error("[credits] release reserved update failed:", updErr.message);
    }
    const { error: holdErr } = await admin.from("credit_holds").update({ status: "released" }).eq("job_id", jobId);
    if (holdErr) console.error("[credits] release hold update failed:", holdErr.message);
    return;
  }

  const redis = getRedis();
  if (!redis) return;
  const raw = await redis.get(redisHoldKey(jobId));
  if (!raw) return;
  const hold = JSON.parse(raw) as { userId: string; amount: number };
  await redis.decrby(redisReservedKey(hold.userId), hold.amount);
  await redis.del(redisHoldKey(jobId));
  await clearRedisHoldExpiry(jobId);
}

/** Release active holds past expires_at (Supabase) or expiry index (Redis). */
export async function releaseExpiredCreditHolds(): Promise<{ released: number }> {
  if (isServerQaBypassActive()) return { released: 0 };

  let released = 0;

  if (await tablesExist()) {
    const admin = createSupabaseAdmin();
    const now = new Date().toISOString();
    const fallbackCutoff = new Date(Date.now() - CREDIT_HOLD_TTL_MS).toISOString();
    const [{ data: byExpiry }, { data: byAge }] = await Promise.all([
      admin.from("credit_holds").select("job_id").eq("status", "active").lt("expires_at", now).limit(50),
      admin
        .from("credit_holds")
        .select("job_id")
        .eq("status", "active")
        .is("expires_at", null)
        .lt("created_at", fallbackCutoff)
        .limit(50),
    ]);
    const jobIds = [
      ...new Set([...(byExpiry ?? []), ...(byAge ?? [])].map((h) => h.job_id)),
    ].slice(0, 50);

    for (const jobId of jobIds) {
      await releaseCreditHold(jobId);
      released += 1;
    }
    return { released };
  }

  const redis = getRedis();
  if (!redis) return { released: 0 };

  const expired = await redis.zrange(REDIS_HOLD_EXPIRY_INDEX, 0, Date.now(), { byScore: true });
  for (const jobId of expired.slice(0, 50)) {
    await releaseCreditHold(jobId);
    await clearRedisHoldExpiry(jobId);
    released += 1;
  }
  return { released };
}

export async function grantPurchaseCredits(
  userId: string,
  credits: number,
  meta?: Record<string, unknown>,
): Promise<{ ok: true; balance: number } | { ok: false; code: string; message: string }> {
  if (credits <= 0) {
    return { ok: false, code: "invalid_amount", message: "Credit amount must be positive." };
  }

  if (await tablesExist()) {
    const admin = createSupabaseAdmin();
    const { data: acct } = await admin
      .from("credit_accounts")
      .select("balance, lifetime_granted")
      .eq("user_id", userId)
      .maybeSingle();

    if (!acct) {
      const { error: insErr } = await admin.from("credit_accounts").insert({
        user_id: userId,
        balance: credits,
        reserved: 0,
        lifetime_granted: 0,
      });
      if (insErr) {
        console.error("[credits] purchase account insert failed:", insErr.message);
        return { ok: false, code: "db_error", message: "Failed to create credit account." };
      }
      const { error: txErr } = await admin.from("credit_transactions").insert({
        user_id: userId,
        type: "purchase",
        amount: credits,
        balance_after: credits,
        meta: meta ?? null,
      });
      if (txErr) console.error("[credits] purchase tx insert failed:", txErr.message);
      return { ok: true, balance: credits };
    }

    const nextBal = (acct.balance ?? 0) + credits;
    const { error: updErr } = await admin
      .from("credit_accounts")
      .update({ balance: nextBal, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (updErr) {
      console.error("[credits] purchase balance update failed:", updErr.message);
      return { ok: false, code: "db_error", message: "Failed to update credit balance." };
    }
    const { error: txErr2 } = await admin.from("credit_transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: credits,
      balance_after: nextBal,
      meta: meta ?? null,
    });
    if (txErr2) console.error("[credits] purchase tx insert failed:", txErr2.message);
    return { ok: true, balance: nextBal };
  }

  const redis = getRedis();
  if (!redis) {
    return { ok: false, code: "credits_unavailable", message: "Credit system unavailable." };
  }
  const nextBal = await redis.incrby(redisBalanceKey(userId), credits);
  return { ok: true, balance: nextBal };
}
