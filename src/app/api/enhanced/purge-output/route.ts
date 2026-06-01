import { requireApiUser } from "@/server/enhanced/auth";
import { isEnhancedInfraConfigured } from "@/server/enhanced/config";
import { deleteEnhancedKeys, isEnhancedUserKey } from "@/server/enhanced/enhancedR2Purge";
import { getProcessingJob } from "@/server/enhanced/jobStore";
import { getAppEnv } from "@/server/types";
import { hasS3Credentials } from "@/server/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isEnhancedInfraConfigured()) {
    return Response.json({ error: "enhanced_unavailable" }, { status: 503 });
  }

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: { jobId?: unknown; inputR2Key?: unknown; outputR2Key?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!jobId) {
    return Response.json({ error: "invalid_request", message: "jobId required" }, { status: 400 });
  }

  const job = await getProcessingJob(jobId, user.id);
  if (!job) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const env = getAppEnv();
  if (!hasS3Credentials(env)) {
    return Response.json({ error: "r2_unavailable" }, { status: 503 });
  }

  const keys: string[] = [];
  const inputKey =
    typeof body.inputR2Key === "string" && body.inputR2Key.trim()
      ? body.inputR2Key.trim()
      : job.input_r2_key;
  const outputKey =
    typeof body.outputR2Key === "string" && body.outputR2Key.trim()
      ? body.outputR2Key.trim()
      : job.output_r2_key;

  if (inputKey && isEnhancedUserKey(user.id, inputKey, "input")) keys.push(inputKey);
  if (outputKey && isEnhancedUserKey(user.id, outputKey, "output")) keys.push(outputKey);

  const deleted = await deleteEnhancedKeys(env, keys);
  return Response.json({ ok: true, deleted });
}
