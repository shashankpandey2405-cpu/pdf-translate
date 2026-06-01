import type { AppEnv } from "./types";
import { val } from "./strings";

/** Must match App Router mount at app/api/auth/[...slug] and Google redirect URIs. */
export const AUTH_BASE_PATH = "/api/auth";

export function getAuthSecret(env: AppEnv): string {
  return val(env.AUTH_SECRET) ?? val(env.NEXTAUTH_SECRET) ?? "";
}

export function getGoogleClientId(env: AppEnv): string {
  return val(env.AUTH_GOOGLE_ID) ?? val(env.GOOGLE_CLIENT_ID) ?? "";
}

export function getGoogleClientSecret(env: AppEnv): string {
  return val(env.AUTH_GOOGLE_SECRET) ?? val(env.GOOGLE_CLIENT_SECRET) ?? "";
}

export function getAuthAppOrigin(env: AppEnv): string {
  return (val(env.AUTH_URL) ?? val(env.NEXTAUTH_URL) ?? "").replace(/\/$/, "");
}

export function getSignInPath(env: AppEnv): string {
  const p = val(env.AUTH_SIGNIN_PATH) ?? "/en/login";
  return p.startsWith("/") ? p : `/${p}`;
}

export function isAuthTrustHost(env: AppEnv): boolean {
  return val(env.AUTH_TRUST_HOST) !== "false";
}

export function isAuthConfigured(env: AppEnv): boolean {
  return Boolean(getAuthSecret(env));
}

export function isGoogleAuthConfigured(env: AppEnv): boolean {
  return Boolean(getGoogleClientId(env) && getGoogleClientSecret(env));
}

/** Logs actionable setup hints; returns list of problem codes for API responses. */
export function logAuthConfigProblems(env: AppEnv): string[] {
  const problems: string[] = [];
  if (!getAuthSecret(env)) {
    problems.push("missing_auth_secret");
    console.error(
      "[auth] Missing AUTH_SECRET or NEXTAUTH_SECRET — set in .env.local (local) or Vercel Environment Variables (production).",
    );
  }
  if (!isGoogleAuthConfigured(env)) {
    problems.push("missing_google_oauth");
    console.error(
      "[auth] Missing AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (or GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
    );
  }
  const origin = getAuthAppOrigin(env);
  if (!origin && !isAuthTrustHost(env)) {
    problems.push("missing_auth_url");
    console.warn(
      "[auth] NEXTAUTH_URL / AUTH_URL unset and AUTH_TRUST_HOST=false — OAuth redirects may fail. Set NEXTAUTH_URL or AUTH_TRUST_HOST=true.",
    );
  }
  return problems;
}
