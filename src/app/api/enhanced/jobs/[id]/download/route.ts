import { GetObjectCommand } from "@aws-sdk/client-s3";
import { requireApiUser } from "@/server/enhanced/auth";
import { getProcessingJob } from "@/server/enhanced/jobStore";
import { getAppEnv } from "@/server/types";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import { apiError } from "@/server/apiHandler";
import { originalNameFromInputKey, outputFilenameForTool } from "@/lib/files/deriveOutputFilename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function contentTypeForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (lower.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (lower.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const job = await getProcessingJob(id, user.id);
  if (!job) {
    return apiError("not_found", "Job not found.", 404);
  }
  if (job.status !== "done" || !job.output_r2_key) {
    return apiError("not_ready", "Job output is not ready yet.", 409);
  }

  const env = getAppEnv();
  if (!hasS3Credentials(env)) {
    return apiError("storage_unavailable", "Cloud storage is not configured.", 503);
  }

  const client = getS3Client(env);
  const bucket = getS3Bucket(env);
  const key = job.output_r2_key;

  try {
    const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const body = out.Body;
    if (!body) {
      return apiError("output_missing", "Output file missing in storage.", 404);
    }
    const bytes = await body.transformToByteArray();
    const keyLeaf = key.split("/").pop() ?? "result.bin";
    const original = originalNameFromInputKey(job.input_r2_key) ?? keyLeaf;
    const ext = keyLeaf.includes(".") ? keyLeaf.split(".").pop() : undefined;
    const filename = outputFilenameForTool(job.tool_slug, original, ext);
    const type = out.ContentType || contentTypeForKey(key);

    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[enhanced/jobs/download]", e);
    return apiError("download_failed", "Could not read output from storage.", 500, msg);
  }
}

