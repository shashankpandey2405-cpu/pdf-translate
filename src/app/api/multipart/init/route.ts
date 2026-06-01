import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getAppEnv } from "@/server/types";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import {
  assertMultipartMinSize,
  checkR2UploadPolicy,
  resolveMaxUploadBytes,
} from "@/server/uploadPolicy";
import { issueMultipartUploadToken } from "@/server/multipartUploadToken";
import { getSupabaseUserFromRequest } from "@/server/supabaseAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PART_SIZE = 8 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

async function postMultipartInit(req: Request) {
  const env = getAppEnv();
  let body: { filename?: unknown; contentType?: unknown; fileSize?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const filename = typeof body.filename === "string" ? body.filename : "";
  if (!filename) return Response.json({ error: "filename is required" }, { status: 400 });

  const size = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
  const cookieHeader = req.headers.get("cookie") ?? undefined;
  const maxBytes = await resolveMaxUploadBytes(req, env);
  const minErr = assertMultipartMinSize(size, maxBytes);
  if (minErr) {
    return Response.json({ error: minErr.code, message: minErr.message }, { status: minErr.status });
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
    const prefix = user?.id ? `uploads/${user.id}` : "uploads/anon";
    const key = `${prefix}/${Date.now()}-${sanitizeFilename(filename)}`;
    const safeContentType =
      typeof body.contentType === "string" && body.contentType.trim()
        ? body.contentType
        : "application/octet-stream";
    const partSize = size > 100 * 1024 * 1024 ? 12 * 1024 * 1024 : DEFAULT_PART_SIZE;

    const created = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: safeContentType,
      }),
    );

    if (!created.UploadId) {
      return Response.json({ error: "Failed to create multipart upload" }, { status: 500 });
    }

    const uploadToken = issueMultipartUploadToken({
      key,
      uploadId: created.UploadId,
      userId: user?.id,
    });

    return Response.json({
      uploadId: created.UploadId,
      key,
      bucket,
      partSize,
      uploadToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload init failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export const POST = withSentryRoute("multipart_init", postMultipartInit);
