import { createHmac } from "node:crypto";
import { envString } from "@/server/env";
import { safeEqualString } from "@/server/crypto/timingSafe";

export function workerSecretConfigured(): boolean {
  return Boolean(envString("RENDER_WORKER_SECRET"));
}

export function verifyWorkerSecret(header: string | null): boolean {
  const secret = envString("RENDER_WORKER_SECRET");
  if (!secret || !header) return false;
  return safeEqualString(header, secret);
}

/** Per-request HMAC: jobId + status + optional output key (mitigates single-secret replay). */
export function signWorkerPayload(jobId: string, status: string, outputR2Key?: string | null): string {
  const secret = envString("RENDER_WORKER_SECRET");
  if (!secret) return "";
  const payload = `${jobId}|${status}|${outputR2Key ?? ""}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyWorkerSignature(
  jobId: string,
  status: string,
  outputR2Key: string | null | undefined,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const expected = signWorkerPayload(jobId, status, outputR2Key);
  return safeEqualString(signature, expected);
}

export function authorizeWorkerRequest(
  req: Request,
  jobId: string,
  status: string,
  outputR2Key?: string | null,
): boolean {
  const secretHeader = req.headers.get("x-worker-secret");
  if (verifyWorkerSecret(secretHeader)) return true;
  const sig = req.headers.get("x-worker-signature");
  return verifyWorkerSignature(jobId, status, outputR2Key, sig);
}
