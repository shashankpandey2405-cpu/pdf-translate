import type { Env } from "../env";

const MAX_PER_PREFIX = 500;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isStagedKey(key: string): boolean {
  return key.startsWith("staging/") || key.startsWith("uploads/");
}

/**
 * Best-effort purge of orphaned presign/multipart objects under `staging/` and `uploads/`.
 * Intended for a Cron Trigger (see wrangler.toml). Deletes objects older than 24 hours.
 */
export async function purgeExpiredStagedObjects(env: Env): Promise<{ deleted: number; scanned: number }> {
  if (!env.PDFTRUSTED_R2) return { deleted: 0, scanned: 0 };
  const cutoff = Date.now() - MAX_AGE_MS;
  let deleted = 0;
  let scanned = 0;
  for (const prefix of ["staging/", "uploads/"] as const) {
    let cursor: string | undefined;
    for (;;) {
      const page = await env.PDFTRUSTED_R2.list({ prefix, limit: 100, cursor });
      for (const obj of page.objects) {
        scanned += 1;
        const uploaded = obj.uploaded ? obj.uploaded.getTime() : 0;
        if (uploaded && uploaded < cutoff && isStagedKey(obj.key)) {
          await env.PDFTRUSTED_R2.delete(obj.key);
          deleted += 1;
        }
        if (scanned >= MAX_PER_PREFIX) return { deleted, scanned };
      }
      if (!page.truncated) break;
      cursor = page.cursor;
      if (!cursor) break;
    }
  }
  return { deleted, scanned };
}
