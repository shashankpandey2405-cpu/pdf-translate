/** HttpOnly premium entitlement cookie (set only from verified webhooks / admin). */
export const PREMIUM_COOKIE_NAME = "pt_premium";
export const PREMIUM_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function premiumSetCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${PREMIUM_COOKIE_NAME}=1; Path=/; Max-Age=${PREMIUM_COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax${secure}`;
}

export function premiumClearCookieHeader(): string {
  return `${PREMIUM_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}
