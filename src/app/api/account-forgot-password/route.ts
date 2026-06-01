import { assertForgotPasswordRateLimit } from "@/server/auth/accountRateLimits";
import { findCredentialUserByEmail, isCredentialStorageConfigured } from "@/server/credentialUsers";
import { sendPasswordResetEmail } from "@/server/authMail";
import { signPasswordResetToken } from "@/server/passwordResetJwt";
import { getAuthAppOrigin, getSignInPath } from "@/server/authEnv";
import { getAppEnv } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function originFromRequest(req: Request): string {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(/:$/, "");
  const host = req.headers.get("x-forwarded-host") ?? url.host;
  return `${proto}://${host}`.replace(/\/$/, "");
}

function inferLang(req: Request, env: ReturnType<typeof getAppEnv>): string {
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

export async function POST(req: Request) {
  const env = getAppEnv();
  let raw: { email?: unknown };
  try {
    raw = await req.json();
  } catch {
    return Response.json({ ok: true });
  }
  const email = typeof raw?.email === "string" ? raw.email.trim() : "";

  if (!EMAIL_RE.test(email) || !isCredentialStorageConfigured(env)) {
    return Response.json({ ok: true });
  }

  const rate = await assertForgotPasswordRateLimit(req, email);
  if (!rate.allowed) {
    return Response.json({ ok: true });
  }

  try {
    const user = await findCredentialUserByEmail(env, email);
    if (user) {
      const token = await signPasswordResetToken(env, user.email);
      const base = getAuthAppOrigin(env) || originFromRequest(req);
      const lang = inferLang(req, env);
      const resetUrl = `${base}/${lang}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(env, user.email, resetUrl);
    }
  } catch (e) {
    console.error("[account-forgot-password]", e);
  }

  return Response.json({ ok: true });
}
