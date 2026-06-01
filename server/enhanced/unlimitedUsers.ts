import { envString } from "@/server/env";

let cachedIds: Set<string> | null = null;

/** Comma-separated Supabase user UUIDs in ENHANCED_UNLIMITED_USER_IDS (owner / internal testing). */
export function isUnlimitedEnhancedUser(userId: string | null | undefined): boolean {
  if (!userId?.trim()) return false;
  if (!cachedIds) {
    const raw = envString("ENHANCED_UNLIMITED_USER_IDS");
    cachedIds = new Set(
      raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
  }
  return cachedIds.has(userId.trim().toLowerCase());
}

export const UNLIMITED_USAGE_SNAPSHOT = {
  enhancedUsed: 0,
  enhancedRemaining: 9999,
  dailyLimit: 9999,
  resetsAt: new Date(Date.now() + 86400000).toISOString(),
} as const;
