import bcrypt from "bcryptjs";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { AppEnv } from "./types";
import { getS3Bucket, getS3Client, hasS3Credentials } from "./s3";

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

export function isCredentialStorageConfigured(env: AppEnv): boolean {
  return hasS3Credentials(env);
}

function useDevMemory(env: AppEnv): boolean {
  return !isCredentialStorageConfigured(env);
}

async function readCredentialJson(env: AppEnv, key: string): Promise<string | null> {
  try {
    const client = getS3Client(env);
    const bucket = getS3Bucket(env);
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await out.Body?.transformToString();
    return text ?? null;
  } catch (e: unknown) {
    const name = e && typeof e === "object" && "name" in e ? String((e as { name: string }).name) : "";
    const status =
      e && typeof e === "object" && "$metadata" in e
        ? (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
        : undefined;
    if (name === "NoSuchKey" || status === 404) return null;
    throw e;
  }
}

async function writeCredentialJson(env: AppEnv, key: string, body: string): Promise<void> {
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "application/json",
    }),
  );
}

export async function findCredentialUserByEmail(env: AppEnv, email: string): Promise<StoredCredentialUser | null> {
  const norm = normalizedEmail(email);
  if (!norm) return null;

  if (useDevMemory(env)) {
    return devMemory.get(norm) ?? null;
  }

  const key = await objectKey(norm);
  const raw = await readCredentialJson(env, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCredentialUser;
  } catch {
    return null;
  }
}

export async function createCredentialUser(
  env: AppEnv,
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
  await writeCredentialJson(env, key, JSON.stringify(row));
  return { ok: true };
}

export async function updateCredentialPassword(env: AppEnv, email: string, newPassword: string): Promise<boolean> {
  const u = await findCredentialUserByEmail(env, email);
  if (!u) return false;
  u.passwordHash = await bcrypt.hash(newPassword, 12);

  if (useDevMemory(env)) {
    devMemory.set(u.email, u);
    return true;
  }

  const key = await objectKey(u.email);
  await writeCredentialJson(env, key, JSON.stringify(u));
  return true;
}

export async function verifyCredentialPassword(
  env: AppEnv,
  email: string,
  password: string,
): Promise<StoredCredentialUser | null> {
  const u = await findCredentialUserByEmail(env, email);
  if (!u) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  return ok ? u : null;
}
