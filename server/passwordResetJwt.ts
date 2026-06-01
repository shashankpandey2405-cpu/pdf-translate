import { SignJWT, jwtVerify } from "jose";
import type { AppEnv } from "./types";
import { getAuthSecret } from "./authEnv";

const PURPOSE = "pwd-reset";

function getSecretKey(env: AppEnv): Uint8Array {
  const s = getAuthSecret(env);
  if (!s) throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required for password reset tokens");
  return new TextEncoder().encode(s);
}

export async function signPasswordResetToken(env: AppEnv, email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  return new SignJWT({ purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(norm)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecretKey(env));
}

export async function verifyPasswordResetToken(env: AppEnv, token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(env), { algorithms: ["HS256"] });
    if (payload.purpose !== PURPOSE || typeof payload.sub !== "string") return null;
    return payload.sub.trim().toLowerCase();
  } catch {
    return null;
  }
}
