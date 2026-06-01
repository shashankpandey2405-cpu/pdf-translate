import type { WorkerPool } from "@/server/enhanced/config";

/** Base Redis list key (matches `queueKeyForPool` in config). */
export function baseQueueKey(pool: WorkerPool): string {
  return `enhanced:queue:${pool}`;
}

/** Priority suffix queues — consumers MUST pop in this order. */
export const QUEUE_PRIORITY_SUFFIXES = ["premium", "default", "free"] as const;

export function priorityQueueKeys(pool: WorkerPool): string[] {
  return [
    `${baseQueueKey(pool)}:premium`,
    baseQueueKey(pool),
    `${baseQueueKey(pool)}:free`,
  ];
}

/**
 * Payload format (pipe-separated):
 * jobId|inputR2Key|[urlencoded JSON options]|[traceId]
 */
export function formatQueuePayload(
  jobId: string,
  inputR2Key: string,
  options?: Record<string, unknown>,
  traceId?: string,
): string {
  const optsPart =
    options && Object.keys(options).length > 0
      ? `|${encodeURIComponent(JSON.stringify(options))}`
      : "";
  const tracePart = traceId ? `|${traceId}` : "";
  return `${jobId}|${inputR2Key}${optsPart}${tracePart}`;
}
