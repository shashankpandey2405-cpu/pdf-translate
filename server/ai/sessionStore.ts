import { getQueueRedis } from "@/server/redis/client";
import type { AiSummarizeTier, SummaryLength } from "@/lib/ai/summarizeTier";

export type AiSessionPayload = {
  jobId: string;
  userId: string;
  summaryText: string;
  documentExcerpt: string;
  suggestedQuestions: string[];
  /** Concrete facts visible in the file (shown before chat). */
  documentHighlights?: string[];
  /** Practical next steps inferred from document type. */
  suggestedActions?: string[];
  /** How text was obtained for chat. */
  readMethod?: "text" | "vision_enhanced";
  aiTier: AiSummarizeTier;
  length: SummaryLength;
  outputLang: string;
  createdAt: string;
};

const TTL_SEC = 3600;

function sessionKey(jobId: string): string {
  return `ai:session:${jobId}`;
}

export async function saveAiSession(payload: AiSessionPayload): Promise<void> {
  const redis = getQueueRedis();
  if (!redis) return;
  await redis.set(sessionKey(payload.jobId), JSON.stringify(payload), { ex: TTL_SEC });
}

export async function getAiSession(jobId: string): Promise<AiSessionPayload | null> {
  const redis = getQueueRedis();
  if (!redis) return null;
  const raw = await redis.get(sessionKey(jobId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AiSessionPayload;
  } catch {
    return null;
  }
}
