import { Hono } from "hono";
import type { Env } from "../env";
import { Auth, buildAuthConfig, getAuthSessionJson } from "../lib/auth";
import { hasPremiumCookie } from "../lib/uploadPolicy";
import { isProductAuthOnly } from "../lib/productAuthOnly";

const app = new Hono<{ Bindings: Env }>();

/**
 * Catch-all Auth.js handler at /api/auth/*. @auth/core takes a Request and returns
 * a Response, so this maps 1:1 onto Hono's fetch-style context.
 */
app.all("/auth/*", async (c) => {
  return await Auth(c.req.raw, buildAuthConfig(c.env));
});

/** GET /api/session — returns { user, isPremium } for the SPA's PremiumContext. */
app.get("/session", async (c) => {
  try {
    const session = await getAuthSessionJson(c.req.raw, c.env);
    const cookieHeader = c.req.header("cookie") ?? undefined;
    const cookiePremium = hasPremiumCookie(cookieHeader);
    const isPremium = isProductAuthOnly(c.env) ? false : cookiePremium;
    return c.json({ ...session, isPremium });
  } catch {
    return c.json({ user: undefined, isPremium: false });
  }
});

export default app;
