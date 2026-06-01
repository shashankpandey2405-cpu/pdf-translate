/**
 * S3-compatible client for Cloudflare R2 (presigned-URL upload path).
 *
 * Native R2 binding (env.PDFTRUSTED_R2) is preferred for server-side reads/writes
 * inside the Worker. This module exists only so the browser can PUT large objects
 * directly to R2 via short-lived presigned URLs without proxying bytes through the
 * Worker (Workers Free has a 100MB request body cap; presigned URLs bypass it).
 */

import { S3Client } from "@aws-sdk/client-s3";
import type { Env } from "../env";
import { val } from "../env";

function required(value: string | undefined, key: string): string {
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value;
}

export function getS3Bucket(env: Env): string {
  return required(val(env.S3_BUCKET), "S3_BUCKET");
}

export function getS3Client(env: Env): S3Client {
  const endpoint = val(env.S3_ENDPOINT);
  return new S3Client({
    region: val(env.S3_REGION) ?? "auto",
    endpoint,
    forcePathStyle: !!endpoint,
    credentials: {
      accessKeyId: required(val(env.S3_ACCESS_KEY_ID), "S3_ACCESS_KEY_ID"),
      secretAccessKey: required(val(env.S3_SECRET_ACCESS_KEY), "S3_SECRET_ACCESS_KEY"),
    },
  });
}

export function hasS3Credentials(env: Env): boolean {
  return Boolean(val(env.S3_BUCKET) && val(env.S3_ACCESS_KEY_ID) && val(env.S3_SECRET_ACCESS_KEY));
}
