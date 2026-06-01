/**
 * /api/r2/presign-put — issues a short-lived S3-compatible PUT URL for direct
 * browser uploads to R2. The bytes never flow through the Worker, which keeps us
 * under the 100MB request body cap on Workers Free and avoids burning CPU time.
 *
 * /api/r2/delete-staged — authenticated POST to remove short-lived `staging/` or `uploads/` keys
 * after the browser finishes client-side processing.
 */

import { Hono } from "hono";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../env";
import { envFlagTrue } from "../env";
import { getS3Bucket, getS3Client } from "../lib/s3";
import { assertPresignedPutRange, checkR2UploadPolicy } from "../lib/uploadPolicy";
import { getSessionUser } from "../lib/sessionUser";

const app = new Hono<{ Bindings: Env }>();

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

app.post("/presign-put", async (c) => {
  let body: { filename?: unknown; contentType?: unknown; fileSize?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json", message: "Body must be JSON" }, 400);
  }

  const filename = typeof body.filename === "string" ? body.filename : "";
  if (!filename) {
    return c.json({ error: "filename is required" }, 400);
  }
  const size = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
  const rangeErr = assertPresignedPutRange(size);
  if (rangeErr) {
    return c.json({ error: rangeErr.code, message: rangeErr.message }, rangeErr.status as 400);
  }
  const policyErr = checkR2UploadPolicy(c.env, size, c.req.header("cookie") ?? undefined);
  if (policyErr) {
    return c.json({ error: policyErr.code, message: policyErr.message }, policyErr.status as 400);
  }

  try {
    const client = getS3Client(c.env);
    const bucket = getS3Bucket(c.env);
    const key = `staging/${Date.now()}-${sanitizeFilename(filename)}`;
    const safeContentType =
      typeof body.contentType === "string" && body.contentType.trim()
        ? body.contentType
        : "application/octet-stream";

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeContentType,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 900 });

    return c.json({ url, key, bucket, method: "PUT" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Presign failed";
    return c.json({ error: message }, 500);
  }
});

/** POST /api/r2/delete-staged — remove short-lived staging keys after browser processing (auth optional when PUBLIC_FREE_SUITE). */
app.post("/delete-staged", async (c) => {
  const user = await getSessionUser(c.req.raw, c.env);
  const allowAnonCleanup = envFlagTrue(c.env.PUBLIC_FREE_SUITE);
  if (!user && !allowAnonCleanup) {
    return c.json({ error: "unauthorized", message: "Sign in to delete staged uploads." }, 401);
  }
  let body: { keys?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const raw = body.keys;
  if (!Array.isArray(raw)) {
    return c.json({ error: "keys must be an array" }, 400);
  }
  if (raw.length > 100) {
    return c.json({ error: "too_many_keys" }, 400);
  }
  const keys: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !item.trim()) continue;
    const key = item.trim();
    if (!key.startsWith("staging/") && !key.startsWith("uploads/")) {
      return c.json({ error: "invalid_key", message: "Only staging/ and uploads/ keys are allowed." }, 400);
    }
    keys.push(key);
  }
  if (!keys.length) {
    return c.json({ ok: true, deleted: 0 });
  }
  if (!c.env.PDFTRUSTED_R2) {
    return c.json({ error: "r2_unavailable" }, 503);
  }
  for (const key of keys) {
    await c.env.PDFTRUSTED_R2.delete(key);
  }
  return c.json({ ok: true, deleted: keys.length });
});

export default app;
