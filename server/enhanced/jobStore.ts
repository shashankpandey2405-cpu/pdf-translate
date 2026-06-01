import { randomUUID } from "crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getAppEnv } from "@/server/types";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import type { WorkerPool } from "@/server/enhanced/config";

export type ProcessingJobRow = {
  id: string;
  user_id: string;
  tool_slug: string;
  status: string;
  trace_id?: string;
  input_r2_key: string | null;
  output_r2_key: string | null;
  error_code: string | null;
  error_message: string | null;
  pages: number | null;
  file_size_bytes: number;
  worker_pool: string;
  progress: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export async function createProcessingJob(input: {
  userId: string;
  toolSlug: string;
  inputR2Key: string;
  fileSizeBytes: number;
  pages: number | null;
  workerPool: WorkerPool;
  jobId?: string;
  traceId?: string;
}): Promise<ProcessingJobRow> {
  const admin = createSupabaseAdmin();
  const traceId = input.traceId ?? randomUUID();
  const row: Record<string, unknown> = {
    user_id: input.userId,
    tool_slug: input.toolSlug,
    mode: "enhanced",
    status: "queued",
    input_r2_key: input.inputR2Key,
    file_size_bytes: input.fileSizeBytes,
    pages: input.pages,
    worker_pool: input.workerPool,
    progress: 0,
    trace_id: traceId,
  };
  if (input.jobId) {
    row.id = input.jobId;
  }
  const { data, error } = await admin
    .from("processing_jobs")
    .insert(row)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create processing job");
  }
  return data as ProcessingJobRow;
}

export async function getProcessingJob(jobId: string, userId: string): Promise<ProcessingJobRow | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("processing_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ProcessingJobRow | null) ?? null;
}

export async function getSignedDownloadUrl(key: string, expiresSec = 900): Promise<string | null> {
  const env = getAppEnv();
  if (!hasS3Credentials(env)) return null;
  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: expiresSec },
  );
}

export function outputKeyForJob(userId: string, jobId: string, ext: string): string {
  return `enhanced/output/${userId}/${jobId}.${ext.replace(/^\./, "")}`;
}

export function inputKeyForJob(userId: string, jobId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  return `enhanced/input/${userId}/${jobId}-${safe}`;
}

export async function failProcessingJob(
  jobId: string,
  userId: string,
  errorCode: string,
  errorMessage: string,
): Promise<void> {
  const admin = createSupabaseAdmin();
  await admin
    .from("processing_jobs")
    .update({
      status: "failed",
      error_code: errorCode,
      error_message: errorMessage,
      finished_at: new Date().toISOString(),
      progress: 0,
    })
    .eq("id", jobId)
    .eq("user_id", userId);
}
