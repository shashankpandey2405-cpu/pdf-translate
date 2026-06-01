import { createHmac, timingSafeEqual } from "node:crypto";
import { envString } from "@/server/env";

const TOKEN_TTL_SEC = 900;

type MultipartTokenPayload = {
  key: string;
  uploadId: string;
  exp: number;
  userId?: string;
};

function signingSecret(): string {
  return (
    envString("MULTIPART_UPLOAD_SECRET") ||
    envString("RENDER_WORKER_SECRET") ||
    envString("SUPABASE_SERVICE_ROLE_KEY") ||
    ""
  );
}

function encodePayload(payload: MultipartTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): MultipartTokenPayload | null {
  try {
    const raw = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as MultipartTokenPayload;
    if (!parsed?.key || !parsed?.uploadId || !parsed?.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function issueMultipartUploadToken(opts: {
  key: string;
  uploadId: string;
  userId?: string | null;
}): string {
  const secret = signingSecret();
  if (!secret) throw new Error("multipart_signing_not_configured");
  const payload: MultipartTokenPayload = {
    key: opts.key,
    uploadId: opts.uploadId,
    userId: opts.userId ?? undefined,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
  };
  const body = encodePayload(payload);
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyMultipartUploadToken(
  token: string,
  key: string,
  uploadId: string,
): { ok: true; userId?: string } | { ok: false; reason: string } {
  const secret = signingSecret();
  if (!secret) return { ok: false, reason: "not_configured" };
  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false, reason: "malformed" };
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  try {
    if (
      !timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))
    ) {
      return { ok: false, reason: "invalid_signature" };
    }
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }
  const payload = decodePayload(body);
  if (!payload) return { ok: false, reason: "invalid_payload" };
  if (payload.exp < Math.floor(Date.now() / 1000)) return { ok: false, reason: "expired" };
  if (payload.key !== key || payload.uploadId !== uploadId) {
    return { ok: false, reason: "mismatch" };
  }
  if (!key.startsWith("uploads/")) return { ok: false, reason: "invalid_key_prefix" };
  return { ok: true, userId: payload.userId };
}
