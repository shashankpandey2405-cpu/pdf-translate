import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { AppEnv } from "@/server/types";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";

/** Deletes objects by key from the configured R2/S3 bucket (staging/uploads prefixes expected). */
export async function deleteStagedKeysFromBucket(env: AppEnv, keys: string[]): Promise<number> {
  if (!keys.length || !hasS3Credentials(env)) return 0;
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  for (const key of keys) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
  return keys.length;
}
