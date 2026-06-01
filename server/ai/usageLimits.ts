import { getRedis } from "@/server/enhanced/redis";
import { isServerQaBypassActive } from "@/server/qa/isQaMode";
import { AI_LIFETIME_TRIAL_LIMIT } from "@/server/ai/config";

const TRIAL_KEY_PREFIX = "ai:trial:used:";

export type AiTrialSnapshot = {
  trialLimit: number;
  trialUsed: number;
  trialRemaining: number;
};

export async function getAiTrialSnapshot(userId: string): Promise<AiTrialSnapshot> {
  if (isServerQaBypassActive()) {
    return {
      trialLimit: AI_LIFETIME_TRIAL_LIMIT,
      trialUsed: 0,
      trialRemaining: AI_LIFETIME_TRIAL_LIMIT,
    };
  }
  const redis = getRedis();
  if (!redis) {
    return { trialLimit: AI_LIFETIME_TRIAL_LIMIT, trialUsed: 0, trialRemaining: AI_LIFETIME_TRIAL_LIMIT };
  }
  const used = await redis.get(`${TRIAL_KEY_PREFIX}${userId}`);
  const trialUsed = used ? 1 : 0;
  const trialRemaining = Math.max(0, AI_LIFETIME_TRIAL_LIMIT - trialUsed);
  return { trialLimit: AI_LIFETIME_TRIAL_LIMIT, trialUsed, trialRemaining };
}

export async function reserveAiTrialSlot(
  userId: string,
  jobId: string,
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (isServerQaBypassActive()) {
    return { ok: true };
  }

  const redis = getRedis();
  if (!redis) {
    return {
      ok: false,
      code: "ai_unavailable",
      message: "AI processing requires Redis. Try again later.",
    };
  }

  const trialKey = `${TRIAL_KEY_PREFIX}${userId}`;
  const claimKey = `ai:trial:claim:${userId}:${jobId}`;

  const alreadyUsed = await redis.get(trialKey);
  if (alreadyUsed) {
    return {
      ok: false,
      code: "AI_TRIAL_USED",
      message:
        "Your free AI trial is already used. AI Plus (5 MB, 2 pages) is limited to one trial per account.",
    };
  }

  const claimed = await redis.set(claimKey, "1", { nx: true, ex: 86400 });
  if (!claimed) {
    return { ok: true };
  }

  const marked = await redis.set(trialKey, "1", { nx: true });
  if (!marked) {
    await redis.del(claimKey);
    return {
      ok: false,
      code: "AI_TRIAL_USED",
      message: "Your free AI trial is already used.",
    };
  }

  return { ok: true };
}
