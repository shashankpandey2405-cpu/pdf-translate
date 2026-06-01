/**
 * R2 multipart upload coordination for files > 35MB (up to 50MB cap). All actual bytes go
 * browser -> R2 via per-part presigned PUT URLs; this router only signs the URLs
 * and coordinates the upload lifecycle.
 */

import { Hono } from "hono";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../env";
import { getS3Bucket, getS3Client } from "../lib/s3";
import { assertMultipartMinSize, checkR2UploadPolicy } from "../lib/uploadPolicy";

const DEFAULT_PART_SIZE = 8 * 1024 * 1024;

const app = new Hono<{ Bindings: Env }>();

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

app.post("/init", async (c) => {
  let body: { filename?: unknown; contentType?: unknown; fileSize?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const filename = typeof body.filename === "string" ? body.filename : "";
  if (!filename) return c.json({ error: "filename is required" }, 400);

  const size = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
  const minErr = assertMultipartMinSize(size);
  if (minErr) {
    return c.json({ error: minErr.code, message: minErr.message }, minErr.status as 400);
  }
  const policyErr = checkR2UploadPolicy(c.env, size, c.req.header("cookie") ?? undefined);
  if (policyErr) {
    return c.json({ error: policyErr.code, message: policyErr.message }, policyErr.status as 400);
  }

  try {
    const client = getS3Client(c.env);
    const bucket = getS3Bucket(c.env);
    const key = `uploads/${Date.now()}-${sanitizeFilename(filename)}`;
    const safeContentType =
      typeof body.contentType === "string" && body.contentType.trim()
        ? body.contentType
        : "application/octet-stream";
    const partSize = size > 100 * 1024 * 1024 ? 12 * 1024 * 1024 : DEFAULT_PART_SIZE;

    const created = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: safeContentType,
      }),
    );

    if (!created.UploadId) {
      return c.json({ error: "Failed to create multipart upload" }, 500);
    }

    return c.json({ uploadId: created.UploadId, key, bucket, partSize });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload init failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/sign-part", async (c) => {
  let body: { key?: unknown; uploadId?: unknown; partNumber?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const key = typeof body.key === "string" ? body.key : "";
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  const partNumber = typeof body.partNumber === "number" ? body.partNumber : Number(body.partNumber);
  if (!key || !uploadId || !Number.isFinite(partNumber)) {
    return c.json({ error: "key, uploadId and partNumber are required" }, 400);
  }

  try {
    const client = getS3Client(c.env);
    const bucket = getS3Bucket(c.env);
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 900 });
    return c.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign part failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/complete", async (c) => {
  let body: { key?: unknown; uploadId?: unknown; parts?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const key = typeof body.key === "string" ? body.key : "";
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  const parts = Array.isArray(body.parts) ? body.parts : null;
  if (!key || !uploadId || !parts || parts.length === 0) {
    return c.json({ error: "key, uploadId and parts are required" }, 400);
  }

  const sorted = parts
    .filter(
      (p): p is { partNumber: number; etag: string } =>
        !!p &&
        typeof (p as { partNumber?: unknown }).partNumber === "number" &&
        typeof (p as { etag?: unknown }).etag === "string",
    )
    .sort((a, b) => a.partNumber - b.partNumber)
    .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag }));

  try {
    const client = getS3Client(c.env);
    const bucket = getS3Bucket(c.env);
    const completed = await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: sorted },
      }),
    );

    return c.json({
      key,
      location: completed.Location ?? "",
      etag: completed.ETag ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Complete upload failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/abort", async (c) => {
  let body: { key?: unknown; uploadId?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const key = typeof body.key === "string" ? body.key : "";
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  if (!key || !uploadId) {
    return c.json({ error: "key and uploadId are required" }, 400);
  }

  try {
    const client = getS3Client(c.env);
    const bucket = getS3Bucket(c.env);
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );
    return c.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Abort upload failed";
    return c.json({ error: message }, 500);
  }
});

export default app;
