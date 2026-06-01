import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import type { AppEnv } from "./types";
import { getS3Bucket, getS3Client, hasS3Credentials } from "./s3";

const MAX_PER_RUN = 120;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isStagedKey(key: string): boolean {
  return (
    key.startsWith("staging/") ||
    key.startsWith("uploads/") ||
    key.startsWith("enhanced/input/") ||
    key.startsWith("enhanced/output/")
  );
}

/** Purge stale presigned / multipart objects (same intent as Cloudflare cron). */
export async function purgeExpiredStagedObjects(env: AppEnv): Promise<{ deleted: number; scanned: number }> {
  if (!hasS3Credentials(env)) return { deleted: 0, scanned: 0 };
  const cutoff = Date.now() - MAX_AGE_MS;
  let deleted = 0;
  let scanned = 0;
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);

  for (const prefix of ["staging/", "uploads/", "enhanced/input/", "enhanced/output/"] as const) {
    let continuationToken: string | undefined;
    for (;;) {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 100,
        }),
      );
      for (const obj of page.Contents ?? []) {
        if (!obj.Key || scanned >= MAX_PER_RUN) break;
        scanned += 1;
        const uploaded = obj.LastModified?.getTime() ?? 0;
        if (uploaded && uploaded < cutoff && isStagedKey(obj.Key)) {
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
          deleted += 1;
        }
      }
      if (scanned >= MAX_PER_RUN) return { deleted, scanned };
      if (!page.IsTruncated) break;
      continuationToken = page.NextContinuationToken;
      if (!continuationToken) break;
    }
  }
  return { deleted, scanned };
}
