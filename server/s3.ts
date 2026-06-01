import { S3Client } from "@aws-sdk/client-s3";
import type { AppEnv } from "./types";
import { val } from "./strings";

function required(value: string | undefined, key: string): string {
  if (!value) {
    const err = new Error(`Missing required env: ${key}`);
    err.name = "MissingEnvError";
    throw err;
  }
  return value;
}

export function getS3Bucket(env: AppEnv): string {
  return required(val(env.S3_BUCKET), "S3_BUCKET");
}

export function getS3Client(env: AppEnv): S3Client {
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

export function hasS3Credentials(env: AppEnv): boolean {
  return Boolean(val(env.S3_BUCKET) && val(env.S3_ACCESS_KEY_ID) && val(env.S3_SECRET_ACCESS_KEY));
}
