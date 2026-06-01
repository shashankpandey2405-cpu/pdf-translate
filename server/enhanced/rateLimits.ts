import { rateLimitGet, rateLimitIncr } from "@/server/enhanced/redis";
import { envString } from "@/server/env";
import { isServerQaBypassActive } from "@/server/qa/isQaMode";

const GUEST_HOURLY = 10;
const SIGNED_DAILY = 50;

function enhancedIpDailyLimit(): number {
  const raw = envString("ENHANCED_IP_DAILY_LIMIT");
  const n = raw ? Number(raw) : 30;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

export async function peekLocalProcessRateLimit(opts: {
  isSignedIn: boolean;
  userId: string | null;
  ip: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  if (isServerQaBypassActive()) {
    return { allowed: true };
  }
  if (opts.isSignedIn && opts.userId) {
    const key = `ratelimit:local:day:${opts.userId}`;
    const count = await rateLimitGet(key);
    if (count >= SIGNED_DAILY) {
      return {
        allowed: false,
        reason: "Processing limit reached. Upgrade to Premium to continue.",
      };
    }
    return { allowed: true };
  }

  const key = `ratelimit:local:hour:${opts.ip}`;
  const count = await rateLimitGet(key);
  if (count >= GUEST_HOURLY) {
    return {
      allowed: false,
      reason: "Too many browser jobs this hour. Sign in for higher limits or wait before trying again.",
    };
  }
  return { allowed: true };
}

/** Increment local processing quota after a job actually starts (not on peek/poll). */
export async function recordLocalProcessRateLimit(opts: {
  isSignedIn: boolean;
  userId: string | null;
  ip: string;
}): Promise<void> {
  if (isServerQaBypassActive()) return;
  if (opts.isSignedIn && opts.userId) {
    await rateLimitIncr(`ratelimit:local:day:${opts.userId}`, 86400);
    return;
  }
  await rateLimitIncr(`ratelimit:local:hour:${opts.ip}`, 3600);
}

/** @deprecated Use peekLocalProcessRateLimit + recordLocalProcessRateLimit */
export async function checkLocalProcessRateLimit(opts: {
  isSignedIn: boolean;
  userId: string | null;
  ip: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  const peek = await peekLocalProcessRateLimit(opts);
  if (!peek.allowed) return peek;
  await recordLocalProcessRateLimit(opts);
  return { allowed: true };
}

/** IP abuse guard only — daily user quota is Supabase user_usage (see usageLimits.ts). */
export async function assertEnhancedIpQuota(ip: string, isPremium = false): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  if (isServerQaBypassActive()) {
    return { allowed: true };
  }
  if (isPremium) {
    return { allowed: true };
  }
  const ipKey = `ratelimit:enhanced:ip:day:${ip}`;
  const current = await rateLimitGet(ipKey);
  if (current >= enhancedIpDailyLimit()) {
    return {
      allowed: false,
      reason: "Too many cloud processing requests from this network. Upgrade to Premium or try again later.",
    };
  }
  return { allowed: true };
}

/** Call after a job is successfully enqueued. */
export async function recordEnhancedIpQuota(ip: string): Promise<void> {
  if (isServerQaBypassActive()) {
    return;
  }
  const ipKey = `ratelimit:enhanced:ip:day:${ip}`;
  await rateLimitIncr(ipKey, 86400);
}
