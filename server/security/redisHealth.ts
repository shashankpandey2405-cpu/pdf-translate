import { getRedis } from "@/server/enhanced/redis";
import { isProductionDeployment } from "@/server/qa/isQaMode";
import { envString } from "@/server/env";

export function isRedisConnected(): boolean {
  return Boolean(getRedis());
}

/** Production cloud routes should treat missing Redis as degraded. */
export function isRedisRequiredForProd(): boolean {
  if (!isProductionDeployment()) return false;
  const enhanced =
    envString("NEXT_PUBLIC_ENHANCED_ENABLED") === "true" ||
    envString("VITE_ENHANCED_ENABLED") === "true";
  return enhanced;
}

export function redisUnavailableMessage(): string {
  return "Service temporarily unavailable. Please try again in a few minutes.";
}
