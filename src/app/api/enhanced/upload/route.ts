import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { enhancedMaxFileBytesForTool } from "@/server/enhanced/config";
import { parseProcessingMode } from "@/server/ai/config";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { putObjectBytes } from "@/server/s3Objects";
import { runApiGuard } from "@/server/security/apiGuard";
import { getAppEnv } from "@/server/types";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { hasS3Credentials } from "@/server/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Same-origin upload proxy — avoids browser CORS/CSP blocks on R2 presigned PUT. */
async function postUpload(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "enhanced_upload", ipHourlyMax: 60 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  const env = getAppEnv();
  if (!hasS3Credentials(env)) {
    return stagingUnavailableResponse();
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "invalid_form", message: "Expected multipart form data." }, { status: 400 });
  }

  const key = typeof form.get("key") === "string" ? String(form.get("key")) : "";
  const toolSlug = typeof form.get("toolSlug") === "string" ? String(form.get("toolSlug")) : "";
  const processingModeRaw = form.get("processingMode");
  const processingMode =
    typeof processingModeRaw === "string" ? parseProcessingMode(processingModeRaw) : undefined;
  const file = form.get("file");

  if (!key || !(file instanceof Blob)) {
    return Response.json({ error: "invalid_request", message: "key and file are required." }, { status: 400 });
  }

  if (!key.startsWith(`enhanced/input/${user.id}/`)) {
    return Response.json({ error: "invalid_key", message: "Upload key does not match user." }, { status: 403 });
  }

  const isPremium = await resolveIsPremium(req, env);
  const maxBytes = enhancedMaxFileBytesForTool(toolSlug, processingMode ?? undefined, { isPremium });
  if (file.size > maxBytes) {
    return Response.json(
      { error: "file_too_large", message: `Upload limit for this mode is ${Math.round(maxBytes / (1024 * 1024))} MB.` },
      { status: 413 },
    );
  }

  const contentType =
    typeof form.get("contentType") === "string" && String(form.get("contentType")).trim()
      ? String(form.get("contentType")).trim()
      : file.type || "application/octet-stream";

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) {
    return Response.json({ error: "empty_file", message: "Upload is empty." }, { status: 400 });
  }

  await putObjectBytes(key, bytes, contentType);
  return Response.json({ ok: true, key, bytes: bytes.length });
}

export const POST = withSentryRoute("enhanced_upload", postUpload);
