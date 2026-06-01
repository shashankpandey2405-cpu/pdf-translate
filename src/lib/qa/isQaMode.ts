/**
 * Client-side QA mode indicator — mirrors server PDFTRUSTED_QA_MODE in dev only.
 * Never true in production browser builds.
 */

function parseEnvTrue(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
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

export function isClientQaModeActive(): boolean {
  if (typeof process !== "undefined") {
    if (process.env.NODE_ENV === "production") return false;
    const vercelEnv = (process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? "").toLowerCase();
    if (vercelEnv === "production") return false;
  }
  return (
    parseEnvTrue(readEnv("NEXT_PUBLIC_PDFTRUSTED_QA_MODE")) ||
    parseEnvTrue(readEnv("VITE_PDFTRUSTED_QA_MODE"))
  );
}
