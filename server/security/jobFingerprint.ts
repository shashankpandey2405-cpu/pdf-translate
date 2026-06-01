import { rateLimitIncrWithFallback } from "@/server/security/apiBurstLimit";

/** Same user + same R2 key within 60s — prevent duplicate enqueue spam. */
export async function assertDuplicateJobThrottle(
  userId: string,
  inputR2Key: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const key = `job:dup:${userId}:${inputR2Key}`;
  const check = await rateLimitIncrWithFallback(key, 1, 60);
  if (!check.ok) {
    return {
      ok: false,
      message: "This file is already being processed. Please wait a moment.",
    };
  }
  return { ok: true };
}
