import { getRedis, rateLimitGet, rateLimitIncr } from "@/server/enhanced/redis";
import { isServerQaBypassActive, isProductionDeployment } from "@/server/qa/isQaMode";
import {
  memoryBurstGet,
  memoryBurstIncr,
  memoryFallbackMax,
} from "@/server/security/memoryBurstLimit";

export type BurstLimitResult = { ok: true; message?: string } | { ok: false; message: string };

async function incrWithFallback(
  key: string,
  max: number,
  windowSec: number,
): Promise<BurstLimitResult> {
  const redis = getRedis();
  if (redis) {
    const count = await rateLimitIncr(key, windowSec);
    if (count > max) {
      return {
        ok: false,
        message: "Too many requests. Please wait a few minutes and try again.",
      };
    }
    return { ok: true };
  }

  // Fail-closed in production: memory fallback at 50% of Redis limit.
  if (isProductionDeployment()) {
    const memMax = memoryFallbackMax(max);
    const count = memoryBurstIncr(key, windowSec);
    if (count > memMax) {
      return {
        ok: false,
        message: "Too many requests. Please wait a few minutes and try again.",
      };
    }
    return { ok: true };
  }

  // Local dev without Redis — allow (QA may set PDFTRUSTED_QA_MODE).
  return { ok: true };
}

async function peekWithFallback(key: string, max: number): Promise<BurstLimitResult> {
  const redis = getRedis();
  if (redis) {
    const count = await rateLimitGet(key);
    if (count >= max) {
      return {
        ok: false,
        message: "Too many requests. Please wait a few minutes and try again.",
      };
    }
    return { ok: true };
  }

  if (isProductionDeployment()) {
    const memMax = memoryFallbackMax(max);
    const count = memoryBurstGet(key);
    if (count >= memMax) {
      return {
        ok: false,
        message: "Too many requests. Please wait a few minutes and try again.",
      };
    }
  }
  return { ok: true };
}

/**
 * Redis counter — returns 429 when count exceeds max within windowSec.
 * Falls back to in-memory limits in production when Redis is unavailable.
 */
export async function assertApiBurstLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<BurstLimitResult> {
  if (isServerQaBypassActive()) return { ok: true };
  return incrWithFallback(key, max, windowSec);
}

export async function peekApiBurstLimit(key: string, max: number): Promise<BurstLimitResult> {
  if (isServerQaBypassActive()) return { ok: true };
  return peekWithFallback(key, max);
}

/** Shared presign/job rate limit increment with Redis + memory fallback. */
export async function rateLimitIncrWithFallback(
  key: string,
  max: number,
  windowSec: number,
): Promise<{ ok: true; count: number } | { ok: false; message: string; count: number }> {
  if (isServerQaBypassActive()) return { ok: true, count: 0 };

  const redis = getRedis();
  if (redis) {
    const count = await rateLimitIncr(key, windowSec);
    if (count > max) {
      return {
        ok: false,
        count,
        message: "Too many upload attempts. Please wait and try again.",
      };
    }
    return { ok: true, count };
  }

  if (isProductionDeployment()) {
    const memMax = memoryFallbackMax(max);
    const count = memoryBurstIncr(key, windowSec);
    if (count > memMax) {
      return {
        ok: false,
        count,
        message: "Too many upload attempts. Please wait and try again.",
      };
    }
    return { ok: true, count };
  }

  return { ok: true, count: 0 };
}
