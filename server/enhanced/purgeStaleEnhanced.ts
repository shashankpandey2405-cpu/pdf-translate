import { getSupabaseAdminOrNull } from "@/lib/supabase/admin";
import { releaseCreditHold } from "@/server/credits/ledger";
import { deleteEnhancedKeys } from "@/server/enhanced/enhancedR2Purge";
import type { AppEnv } from "@/server/types";
import { hasS3Credentials } from "@/server/s3";

const STALE_MS = 90_000;
export const STUCK_PROCESSING_MS = 15 * 60 * 1000;

const STUCK_MS_BY_POOL: Record<string, number> = {
  ai: 12 * 60 * 1000,
  docx: 12 * 60 * 1000,
  office: 10 * 60 * 1000,
  excel: 12 * 60 * 1000,
  ocr: 15 * 60 * 1000,
  compress: 10 * 60 * 1000,
};

/** Fail a single job if still queued/processing past the stuck threshold (poll-time recovery for Hobby cron). */
export async function failStuckJobIfNeeded(
  jobId: string,
  userId: string,
  status: string,
  createdAt: string,
  opts?: { workerPool?: string | null; startedAt?: string | null },
): Promise<boolean> {
  if (status !== "queued" && status !== "processing") return false;

  const pool = opts?.workerPool ?? "default";
  const limit = STUCK_MS_BY_POOL[pool] ?? STUCK_PROCESSING_MS;
  const referenceIso =
    status === "processing" && opts?.startedAt ? opts.startedAt : createdAt;
  const ageMs = Date.now() - new Date(referenceIso).getTime();
  if (!Number.isFinite(ageMs) || ageMs < limit) return false;

  const admin = getSupabaseAdminOrNull();
  if (!admin) return false;

  const { error } = await admin
    .from("processing_jobs")
    .update({
      status: "failed",
      error_code: "processing_timeout",
      error_message: "Cloud processing timed out. Please try again.",
      finished_at: new Date().toISOString(),
    })
      .eq("id", jobId)
      .eq("user_id", userId)
      .in("status", ["queued", "processing"]);

  if (!error) {
    try {
      await releaseCreditHold(jobId);
    } catch {
      /* no credit hold for this job */
    }
  }

  return !error;
}

/** Mark queued/processing jobs older than 15 minutes as failed (worker crash / callback loss). */
export async function failStuckProcessingJobs(): Promise<{ failed: number }> {
  const admin = getSupabaseAdminOrNull();
  if (!admin) return { failed: 0 };

  const cutoff = new Date(Date.now() - STUCK_PROCESSING_MS).toISOString();
  const { data: jobs } = await admin
    .from("processing_jobs")
    .select("id")
    .in("status", ["queued", "processing"])
    .lt("created_at", cutoff)
    .limit(50);

  if (!jobs?.length) return { failed: 0 };

  let failed = 0;
  for (const job of jobs) {
    const { error } = await admin
      .from("processing_jobs")
      .update({
        status: "failed",
        error_code: "processing_timeout",
        error_message: "Cloud processing timed out. Please try again.",
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .in("status", ["queued", "processing"]);
    if (!error) {
      failed += 1;
      try {
        await releaseCreditHold(job.id);
      } catch {
        /* no credit hold for this job */
      }
    }
  }
  return { failed };
}

/** Backstop: purge enhanced R2 objects for jobs finished >90s ago. */
export async function purgeStaleEnhancedJobs(env: AppEnv): Promise<{ deleted: number; scanned: number }> {
  if (!hasS3Credentials(env)) return { deleted: 0, scanned: 0 };
  const admin = getSupabaseAdminOrNull();
  if (!admin) return { deleted: 0, scanned: 0 };

  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data: jobs } = await admin
    .from("processing_jobs")
    .select("id, input_r2_key, output_r2_key")
    .eq("status", "done")
    .lt("finished_at", cutoff)
    .limit(40);

  if (!jobs?.length) return { deleted: 0, scanned: 0 };

  const keys: string[] = [];
  for (const job of jobs) {
    if (job.input_r2_key) keys.push(job.input_r2_key);
    if (job.output_r2_key) keys.push(job.output_r2_key);
  }

  const deleted = await deleteEnhancedKeys(env, keys);
  return { deleted, scanned: jobs.length };
}
