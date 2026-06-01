import { requireApiUser } from "@/server/enhanced/auth";
import { getProcessingJob, getSignedDownloadUrl } from "@/server/enhanced/jobStore";
import { failStuckJobIfNeeded } from "@/server/enhanced/purgeStaleEnhanced";
import { withApiHandler } from "@/server/apiHandler";
import { originalNameFromInputKey, outputFilenameForTool } from "@/lib/files/deriveOutputFilename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getJobHandler(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let job = await getProcessingJob(id, user.id);
  if (!job) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  if (job.status === "queued" || job.status === "processing") {
    const timedOut = await failStuckJobIfNeeded(job.id, user.id, job.status, job.created_at, {
      workerPool: job.worker_pool,
      startedAt: job.started_at,
    });
    if (timedOut) {
      job = await getProcessingJob(id, user.id);
      if (!job) {
        return Response.json({ error: "not_found" }, { status: 404 });
      }
    }
  }

  let downloadUrl: string | null = null;
  let downloadUrlDirect: string | null = null;
  let outputFilename: string | null = null;
  if (job.status === "done" && job.output_r2_key) {
    // Same-origin proxy avoids browser CORS blocks on R2 signed URLs.
    downloadUrl = `/api/enhanced/jobs/${job.id}/download`;
    downloadUrlDirect = await getSignedDownloadUrl(job.output_r2_key);
    const parts = job.output_r2_key.split("/");
    const keyLeaf = parts[parts.length - 1] ?? "result.bin";
    const original = originalNameFromInputKey(job.input_r2_key) ?? keyLeaf;
    const ext = keyLeaf.includes(".") ? keyLeaf.split(".").pop() : "pdf";
    outputFilename = outputFilenameForTool(job.tool_slug, original, ext);
  }

  return Response.json({
    jobId: job.id,
    traceId: (job as { trace_id?: string }).trace_id ?? job.id,
    status: job.status,
    progress: job.progress,
    toolSlug: job.tool_slug,
    inputR2Key: job.input_r2_key,
    outputR2Key: job.output_r2_key,
    errorCode: job.error_code,
    errorMessage: job.error_message,
    downloadUrl,
    downloadUrlDirect,
    outputFilename,
    finishedAt: job.finished_at,
  });
}

export const GET = withApiHandler("enhanced.jobs.id", getJobHandler as (req: Request, ctx?: unknown) => Promise<Response>);
