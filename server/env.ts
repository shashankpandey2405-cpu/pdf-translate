import type { AppEnv } from "./types";

/** Read env at runtime without throwing during build / page data collection. */
export function envString(key: keyof AppEnv | string, fallback = ""): string {
  try {
    const v = process.env[key as string];
    if (typeof v === "string" && v.trim()) return v.trim();
  } catch {
    /* build phase */
  }
  return fallback;
}

export function getAppEnvSafe(): AppEnv {
  try {
    return { ...process.env } as AppEnv;
  } catch {
    return {};
  }
}
