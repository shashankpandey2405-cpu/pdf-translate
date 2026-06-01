import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { putObjectBytes } from "@/server/s3Objects";
import { runApiGuard } from "@/server/security/apiGuard";
import { getAppEnv } from "@/server/types";
import { hasS3Credentials } from "@/server/s3";
import { getSupabaseUserFromRequest } from "@/server/supabaseAuth";
import {
  assertPresignedPutRange,
  checkR2UploadPolicy,
  resolveMaxUploadBytes,
} from "@/server/uploadPolicy";
import { validateDeclaredContentType } from "@/server/security/fileMagic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Same-origin staging upload — avoids browser CSP/CORS blocks on R2 presigned PUT. */
async function postUpload(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "r2_upload", ipHourlyMax: 80 });
  if (guard) return guard;

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
  const file = form.get("file");
  if (!key || !(file instanceof Blob)) {
    return Response.json({ error: "invalid_request", message: "key and file are required." }, { status: 400 });
  }

  const user = await getSupabaseUserFromRequest(req);
  const allowedPrefix = user?.id ? `staging/${user.id}/` : "staging/anon/";
  if (!key.startsWith(allowedPrefix)) {
    return Response.json({ error: "invalid_key", message: "Upload key does not match user." }, { status: 403 });
  }

  const maxBytes = await resolveMaxUploadBytes(req, env);
  const rangeErr = assertPresignedPutRange(file.size, maxBytes);
  if (rangeErr) {
    return Response.json({ error: rangeErr.code, message: rangeErr.message }, { status: rangeErr.status });
  }
  const policyErr = checkR2UploadPolicy(env, file.size, req.headers.get("cookie") ?? undefined, maxBytes);
  if (policyErr) {
    return Response.json({ error: policyErr.code, message: policyErr.message }, { status: policyErr.status });
  }

  const filename = typeof form.get("filename") === "string" ? String(form.get("filename")) : "upload";
  const contentType =
    typeof form.get("contentType") === "string" && String(form.get("contentType")).trim()
      ? String(form.get("contentType")).trim()
      : file.type || "application/octet-stream";

  if (!validateDeclaredContentType(contentType, filename)) {
    return Response.json(
      { error: "mime_filename_mismatch", message: "Content type does not match filename." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) {
    return Response.json({ error: "empty_file", message: "Upload is empty." }, { status: 400 });
  }

  await putObjectBytes(key, bytes, contentType);
  return Response.json({ ok: true, key, bytes: bytes.length });
}

export const POST = withSentryRoute("r2_upload", postUpload);
