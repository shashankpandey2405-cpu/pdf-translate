import type { Env } from "../env";
import { val } from "../env";

export function getAuthSecret(env: Env): string {
  return val(env.AUTH_SECRET) ?? val(env.NEXTAUTH_SECRET) ?? "";
}

export function getGoogleClientId(env: Env): string {
  return val(env.AUTH_GOOGLE_ID) ?? val(env.GOOGLE_CLIENT_ID) ?? "";
}

export function getGoogleClientSecret(env: Env): string {
  return val(env.AUTH_GOOGLE_SECRET) ?? val(env.GOOGLE_CLIENT_SECRET) ?? "";
}

/** Canonical origin used for password-reset email links and absolute redirects. */
export function getAuthAppOrigin(env: Env): string {
  return (val(env.AUTH_URL) ?? val(env.NEXTAUTH_URL) ?? "").replace(/\/$/, "");
}

export function getSignInPath(env: Env): string {
  const p = val(env.AUTH_SIGNIN_PATH) ?? "/en/login";
  return p.startsWith("/") ? p : `/${p}`;
}

export function isAuthTrustHost(env: Env): boolean {
  return val(env.AUTH_TRUST_HOST) !== "false";
}
