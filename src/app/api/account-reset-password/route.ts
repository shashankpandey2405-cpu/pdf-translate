import { isCredentialStorageConfigured, updateCredentialPassword } from "@/server/credentialUsers";
import { verifyPasswordResetToken } from "@/server/passwordResetJwt";
import { getAppEnv } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isStrongPassword(p: string): boolean {
  if (p.length < 8 || p.length > 128) return false;
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return false;
  return true;
}

export async function POST(req: Request) {
  const env = getAppEnv();
  if (!isCredentialStorageConfigured(env)) {
    return Response.json({ error: "Password reset is not configured." }, { status: 503 });
  }
  let raw: { token?: unknown; password?: unknown };
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const token = typeof raw?.token === "string" ? raw.token.trim() : "";
  const password = typeof raw?.password === "string" ? raw.password : "";

  if (!token || !password) {
    return Response.json({ error: "Missing token or password." }, { status: 400 });
  }
  if (!isStrongPassword(password)) {
    return Response.json(
      { error: "Password must be 8–128 characters and include at least one letter and one number." },
      { status: 400 },
    );
  }

  const email = await verifyPasswordResetToken(env, token);
  if (!email) {
    return Response.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
  }

  try {
    const ok = await updateCredentialPassword(env, email, password);
    if (!ok) {
      return Response.json({ error: "Could not update password for this account." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[account-reset-password]", e);
    return Response.json({ error: "Could not reset password. Try again later." }, { status: 500 });
  }
}
