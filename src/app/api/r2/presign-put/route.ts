import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAppEnv } from "@/server/types";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import {
  assertPresignedPutRange,
  checkR2UploadPolicy,
  resolveMaxUploadBytes,
} from "@/server/uploadPolicy";
import { getSupabaseUserFromRequest } from "@/server/supabaseAuth";
import { runApiGuard } from "@/server/security/apiGuard";
import { validateDeclaredContentType } from "@/server/security/fileMagic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export async function POST(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "r2_presign", ipHourlyMax: 80 });
  if (guard) return guard;

  const env = getAppEnv();
  let body: { filename?: unknown; contentType?: unknown; fileSize?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json", message: "Body must be JSON" }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename : "";
  if (!filename) {
    return Response.json({ error: "filename is required" }, { status: 400 });
  }
  const size = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
  const cookieHeader = req.headers.get("cookie") ?? undefined;
  const maxBytes = await resolveMaxUploadBytes(req, env);
  const rangeErr = assertPresignedPutRange(size, maxBytes);
  if (rangeErr) {
    return Response.json({ error: rangeErr.code, message: rangeErr.message }, { status: rangeErr.status });
  }
  const policyErr = checkR2UploadPolicy(env, size, cookieHeader, maxBytes);
  if (policyErr) {
    return Response.json({ error: policyErr.code, message: policyErr.message }, { status: policyErr.status });
  }
  if (!hasS3Credentials(env)) {
    return stagingUnavailableResponse();
  }

  try {
    const user = await getSupabaseUserFromRequest(req);
    const client = getS3Client(env);
    const bucket = getS3Bucket(env);
    const prefix = user?.id ? `staging/${user.id}` : "staging/anon";
    const key = `${prefix}/${Date.now()}-${sanitizeFilename(filename)}`;
    const safeContentType =
      typeof body.contentType === "string" && body.contentType.trim()
        ? body.contentType.trim()
        : "application/octet-stream";

    if (!validateDeclaredContentType(safeContentType, filename)) {
      return Response.json(
        { error: "mime_filename_mismatch", message: "Content type does not match filename." },
        { status: 400 },
      );
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: safeContentType,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 900 });

    return Response.json({ url, key, bucket, method: "PUT" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Presign failed";
    return Response.json({ error: message }, { status: 503 });
  }
}
