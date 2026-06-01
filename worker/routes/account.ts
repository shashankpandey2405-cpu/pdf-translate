/**
 * Email / password account endpoints. All storage happens on the native R2 binding
 * (no S3 SDK), per the hybrid strategy.
 *
 * Routes mounted at /api by the parent router:
 *   POST /account-register
 *   POST /account-forgot-password
 *   POST /account-reset-password
 */

import { Hono } from "hono";
import type { Env } from "../env";
import {
  createCredentialUser,
  findCredentialUserByEmail,
  isCredentialStorageConfigured,
  updateCredentialPassword,
} from "../lib/credentialUsers";
import { sendPasswordResetEmail } from "../lib/authMail";
import { signPasswordResetToken, verifyPasswordResetToken } from "../lib/passwordResetJwt";
import { getAuthAppOrigin, getSignInPath } from "../lib/authEnv";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongPassword(p: string): boolean {
  if (p.length < 8 || p.length > 128) return false;
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return false;
  return true;
}

function originFromRequest(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(/:$/, "");
  const host = req.headers.get("x-forwarded-host") ?? url.host;
  return `${proto}://${host}`.replace(/\/$/, "");
}

function inferLang(req: Request, env: Env): string {
  const ref = req.headers.get("referer");
  if (ref) {
    try {
      const u = new URL(ref);
      const first = u.pathname.split("/").filter(Boolean)[0];
      if (first && /^[a-z]{2}$/i.test(first)) return first.toLowerCase();
    } catch {
      /* ignore */
    }
  }
  const parts = getSignInPath(env).split("/").filter(Boolean);
  return parts[0] || "en";
}

const app = new Hono<{ Bindings: Env }>();

app.post("/account-register", async (c) => {
  let raw: { email?: unknown; password?: unknown; name?: unknown };
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  if (!isCredentialStorageConfigured(c.env)) {
    return c.json({ error: "Email sign-up is not configured (R2 binding required)." }, 503);
  }
  if (typeof raw.email !== "string" || typeof raw.password !== "string") {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const email = raw.email.trim();
  const password = raw.password;
  const name = typeof raw.name === "string" ? raw.name.trim() : undefined;

  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "Enter a valid email address." }, 400);
  }
  if (!isStrongPassword(password)) {
    return c.json(
      { error: "Password must be 8–128 characters and include at least one letter and one number." },
      400,
    );
  }

  try {
    const created = await createCredentialUser(c.env, email, password, name);
    if (!created.ok) {
      return c.json({ error: "An account with this email already exists." }, 409);
    }
    return c.json({ ok: true }, 201);
  } catch (e) {
    console.error("[account-register]", e);
    return c.json({ error: "Could not create account. Try again later." }, 500);
  }
});

app.post("/account-forgot-password", async (c) => {
  let raw: { email?: unknown };
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ ok: true });
  }
  const email = typeof raw?.email === "string" ? raw.email.trim() : "";

  if (!EMAIL_RE.test(email) || !isCredentialStorageConfigured(c.env)) {
    // Always 200 to avoid email-enumeration leaks.
    return c.json({ ok: true });
  }

  try {
    const user = await findCredentialUserByEmail(c.env, email);
    if (user) {
      const token = await signPasswordResetToken(c.env, user.email);
      const base = getAuthAppOrigin(c.env) || originFromRequest(c.req.raw);
      const lang = inferLang(c.req.raw, c.env);
      const resetUrl = `${base}/${lang}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(c.env, user.email, resetUrl);
    }
  } catch (e) {
    console.error("[account-forgot-password]", e);
  }

  return c.json({ ok: true });
});

app.post("/account-reset-password", async (c) => {
  if (!isCredentialStorageConfigured(c.env)) {
    return c.json({ error: "Password reset is not configured." }, 503);
  }
  let raw: { token?: unknown; password?: unknown };
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }
  const token = typeof raw?.token === "string" ? raw.token.trim() : "";
  const password = typeof raw?.password === "string" ? raw.password : "";

  if (!token || !password) {
    return c.json({ error: "Missing token or password." }, 400);
  }
  if (!isStrongPassword(password)) {
    return c.json(
      { error: "Password must be 8–128 characters and include at least one letter and one number." },
      400,
    );
  }

  const email = await verifyPasswordResetToken(c.env, token);
  if (!email) {
    return c.json({ error: "This reset link is invalid or has expired. Request a new one." }, 400);
  }

  try {
    const ok = await updateCredentialPassword(c.env, email, password);
    if (!ok) {
      return c.json({ error: "Could not update password for this account." }, 400);
    }
    return c.json({ ok: true });
  } catch (e) {
    console.error("[account-reset-password]", e);
    return c.json({ error: "Could not reset password. Try again later." }, 500);
  }
});

export default app;
