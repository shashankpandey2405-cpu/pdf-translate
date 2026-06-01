import { createCredentialUser, isCredentialStorageConfigured } from "@/server/credentialUsers";
import { assertAccountRegisterRateLimit } from "@/server/auth/accountRateLimits";
import { getAppEnv } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongPassword(p: string): boolean {
  if (p.length < 8 || p.length > 128) return false;
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return false;
  return true;
}

export async function POST(req: Request) {
  const env = getAppEnv();
  const rate = await assertAccountRegisterRateLimit(req);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many sign-up attempts. Please try again later." },
      { status: 429 },
    );
  }
  let raw: { email?: unknown; password?: unknown; name?: unknown };
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isCredentialStorageConfigured(env)) {
    return Response.json({ error: "Email sign-up is not configured (S3/R2 credentials required)." }, { status: 503 });
  }
  if (typeof raw.email !== "string" || typeof raw.password !== "string") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = raw.email.trim();
  const password = raw.password;
  const name = typeof raw.name === "string" ? raw.name.trim() : undefined;

  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!isStrongPassword(password)) {
    return Response.json(
      { error: "Password must be 8–128 characters and include at least one letter and one number." },
      { status: 400 },
    );
  }

  try {
    const created = await createCredentialUser(env, email, password, name);
    if (!created.ok) {
      return Response.json(
        { ok: true, message: "If this email is available, your account is ready. Otherwise sign in." },
        { status: 200 },
      );
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[account-register]", e);
    return Response.json({ error: "Could not create account. Try again later." }, { status: 500 });
  }
}
