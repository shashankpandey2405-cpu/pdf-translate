import { isSupabaseConfigured } from "@/lib/supabase/env";

function parseEnvTrue(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
}

function parseEnvFalse(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "false" || s === "0";
}

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env[key]) {
    return process.env[key];
  }
  try {
    return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
  } catch {
    return undefined;
  }
}

/** Supabase OAuth / session auth available. */
export function isAuthEnabled(): boolean {
  if (parseEnvFalse(readEnv("VITE_AUTH_ENABLED")) || parseEnvFalse(readEnv("NEXT_PUBLIC_AUTH_ENABLED"))) {
    return false;
  }
  return isSupabaseConfigured();
}

/**
 * Opt-in: show sign-in, account, and Premium cloud quota UI (not paid subscription checkout).
 */
export function showAuthPremiumMarketingUi(): boolean {
  return parseEnvTrue(readEnv("VITE_SHOW_AUTH_PREMIUM_UI"));
}

/**
 * When true: no paid checkout; use signed-in free tier + 2/day enhanced cloud jobs.
 * Default false — set to "true" to hide checkout (e.g. before PayPal is configured).
 */
export function authOnlyProductMode(): boolean {
  if (
    parseEnvTrue(readEnv("VITE_AUTH_ONLY_MODE")) ||
    parseEnvTrue(readEnv("AUTH_ONLY_MODE")) ||
    parseEnvTrue(readEnv("NEXT_PUBLIC_AUTH_ONLY_MODE"))
  ) {
    return true;
  }
  return false;
}

/** Hybrid enhanced cloud processing UI + APIs (requires Redis + worker in production). */
export function isEnhancedProcessingEnabled(): boolean {
  return parseEnvTrue(readEnv("NEXT_PUBLIC_ENHANCED_ENABLED")) || parseEnvTrue(readEnv("VITE_ENHANCED_ENABLED"));
}

export function isFeedbackModalEnabledFlag(): boolean {
  return readEnv("NEXT_PUBLIC_FEEDBACK_MODAL_ENABLED") !== "false";
}

export function isDirectDownloadEnabled(): boolean {
  // Direct R2 URLs are blocked by browser CSP — keep same-origin proxy as default.
  return parseEnvTrue(readEnv("NEXT_PUBLIC_DIRECT_DOWNLOAD"));
}

export function isRoutingV2Enabled(): boolean {
  return readEnv("NEXT_PUBLIC_ROUTING_V2") !== "false";
}

export function isEnhancedMultipartEnabled(): boolean {
  return parseEnvTrue(readEnv("NEXT_PUBLIC_ENHANCED_MULTIPART"));
}
