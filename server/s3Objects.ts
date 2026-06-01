import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getAppEnv } from "@/server/types";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";

export async function getObjectHeadBytes(key: string, maxBytes = 16): Promise<Uint8Array> {
  const env = getAppEnv();
  if (!hasS3Credentials(env)) {
    throw new Error("S3 not configured");
  }
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  const res = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: `bytes=0-${Math.max(0, maxBytes - 1)}`,
    }),
  );
  const body = await res.Body?.transformToByteArray();
  return new Uint8Array(body ?? []);
}

export async function getObjectBytes(key: string): Promise<Uint8Array> {
  const env = getAppEnv();
  if (!hasS3Credentials(env)) {
    throw new Error("S3 not configured");
  }
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = await res.Body?.transformToByteArray();
  if (!body?.length) {
    throw new Error("empty_object");
  }
  return new Uint8Array(body);
}

export async function putObjectBytes(
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  const env = getAppEnv();
  if (!hasS3Credentials(env)) {
    throw new Error("S3 not configured");
  }
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );
}
