/**
 * Internal QA bypass gate — NEVER active in production deployments.
 * Enable only in local dev / staging via PDFTRUSTED_QA_MODE=true.
 */

function parseEnvTrue(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
}

export function isProductionDeployment(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  if (vercelEnv === "production") return true;
  return false;
}

/** Server-side QA bypass for limits/throttles (not auth or MIME validation). */
export function isServerQaBypassActive(): boolean {
  if (isProductionDeployment()) return false;
  return parseEnvTrue(process.env.PDFTRUSTED_QA_MODE);
}

/** Unlimited usage snapshot for QA dashboards and client polling. */
export const QA_USAGE_SNAPSHOT = {
  enhancedUsed: 0,
  enhancedRemaining: 999,
  dailyLimit: 999,
  resetsAt: new Date(Date.now() + 86400000).toISOString(),
} as const;

/** Validates x-pdftrusted-qa-secret header when PDFTRUSTED_QA_SECRET is set. */
export function isQaSecretValid(req: Request): boolean {
  const expected = (process.env.PDFTRUSTED_QA_SECRET ?? "").trim();
  if (!expected) return isServerQaBypassActive();
  const provided = req.headers.get("x-pdftrusted-qa-secret")?.trim();
  return provided === expected;
}
