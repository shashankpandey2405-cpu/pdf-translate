import { envString } from "@/server/env";

export const TRANSLATE_MT_URL = envString("TRANSLATE_MT_URL")?.replace(/\/$/, "") ?? "";
export const TRANSLATE_MT_TIMEOUT_MS =
  Number(envString("TRANSLATE_MT_TIMEOUT_MS", "120000")) || 120_000;

export const CLASSIC_MT_BATCH_SIZE = Number(envString("CLASSIC_MT_BATCH_SIZE", "80")) || 80;

export function isClassicMtConfigured(): boolean {
  return Boolean(TRANSLATE_MT_URL?.trim());
}
