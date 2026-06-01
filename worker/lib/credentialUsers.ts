/**
 * Email/password credential storage for Auth.js Credentials provider.
 *
 * Hybrid R2 strategy:
 *  - Read/write small JSON blobs via the NATIVE R2 binding (env.PDFTRUSTED_R2).
 *    This is what the hot path uses on Cloudflare — no S3 SDK overhead, no
 *    presigned URLs, no egress.
 *  - In local dev without the R2 binding (very rare; wrangler dev provides it), or in
 *    an environment without S3 credentials, fall back to an in-memory map.
 */

import bcrypt from "bcryptjs";
import type { Env } from "../env";

export type StoredCredentialUser = {
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: string;
};

const PREFIX = "auth/credentials/v1/";

const devMemory = new Map<string, StoredCredentialUser>();

function normalizedEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function hashKeyFromEmail(email: string): Promise<string> {
  const norm = normalizedEmail(email);
  const data = new TextEncoder().encode(norm);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function objectKey(email: string): Promise<string> {
  const hash = await hashKeyFromEmail(email);
  return `${PREFIX}${hash}.json`;
}

/** Cloudflare wrangler dev always injects the R2 binding when wrangler.toml lists it. */
export function isCredentialStorageConfigured(env: Env): boolean {
  return Boolean(env.PDFTRUSTED_R2);
}

function useDevMemory(env: Env): boolean {
  // If the R2 binding is missing for some reason, fall back to in-memory state.
  return !isCredentialStorageConfigured(env);
}

export async function findCredentialUserByEmail(
  env: Env,
  email: string,
): Promise<StoredCredentialUser | null> {
  const norm = normalizedEmail(email);
  if (!norm) return null;

  if (useDevMemory(env)) {
    return devMemory.get(norm) ?? null;
  }

  const key = await objectKey(norm);
  const obj = await env.PDFTRUSTED_R2.get(key);
  if (!obj) return null;
  const raw = await obj.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCredentialUser;
  } catch {
    return null;
  }
}

export async function createCredentialUser(
  env: Env,
  email: string,
  password: string,
  name?: string,
): Promise<{ ok: true } | { ok: false; code: "exists" }> {
  const norm = normalizedEmail(email);
  const existing = await findCredentialUserByEmail(env, norm);
  if (existing) return { ok: false, code: "exists" };

  const passwordHash = await bcrypt.hash(password, 12);
  const row: StoredCredentialUser = {
    email: norm,
    passwordHash,
    name: name?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  if (useDevMemory(env)) {
    devMemory.set(norm, row);
    return { ok: true };
  }

  const key = await objectKey(norm);
  await env.PDFTRUSTED_R2.put(key, JSON.stringify(row), {
    httpMetadata: { contentType: "application/json" },
  });
  return { ok: true };
}

export async function updateCredentialPassword(
  env: Env,
  email: string,
  newPassword: string,
): Promise<boolean> {
  const u = await findCredentialUserByEmail(env, email);
  if (!u) return false;
  u.passwordHash = await bcrypt.hash(newPassword, 12);

  if (useDevMemory(env)) {
    devMemory.set(u.email, u);
    return true;
  }

  const key = await objectKey(u.email);
  await env.PDFTRUSTED_R2.put(key, JSON.stringify(u), {
    httpMetadata: { contentType: "application/json" },
  });
  return true;
}

export async function verifyCredentialPassword(
  env: Env,
  email: string,
  password: string,
): Promise<StoredCredentialUser | null> {
  const u = await findCredentialUserByEmail(env, email);
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  return ok ? u : null;
}
