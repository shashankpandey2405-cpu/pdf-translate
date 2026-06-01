import { envFlagTrue } from "@/server/strings";
import { envString } from "@/server/env";

/** When true, Vercel drains the AI Redis queue (legacy). Default false when Railway worker is used. */
export function drainAiQueueOnVercel(): boolean {
  if (envFlagTrue(envString("AI_QUEUE_DRAIN_ON_VERCEL"))) return true;
  if (envFlagTrue(envString("DISABLE_RAILWAY_AI_WORKER"))) return true;
  return envString("AI_WORKER_RUNTIME", "railway") !== "railway";
}

export function railwayAiWorkerPingUrl(): string | null {
  const url = envString("RAILWAY_AI_WORKER_PING_URL");
  return url?.trim() || null;
}
