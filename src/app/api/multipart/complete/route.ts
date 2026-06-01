import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getAppEnv } from "@/server/types";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import { verifyMultipartUploadToken } from "@/server/multipartUploadToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postMultipartComplete(req: Request) {
  const env = getAppEnv();
  let body: { key?: unknown; uploadId?: unknown; parts?: unknown; uploadToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const key = typeof body.key === "string" ? body.key : "";
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  const uploadToken = typeof body.uploadToken === "string" ? body.uploadToken : "";
  const parts = Array.isArray(body.parts) ? body.parts : null;
  if (!key || !uploadId || !uploadToken || !parts || parts.length === 0) {
    return Response.json(
      { error: "key, uploadId, uploadToken and parts are required" },
      { status: 400 },
    );
  }

  const verified = verifyMultipartUploadToken(uploadToken, key, uploadId);
  if (!verified.ok) {
    return Response.json({ error: "forbidden", message: "Invalid upload session." }, { status: 403 });
  }

  const sorted = parts
    .filter(
      (p): p is { partNumber: number; etag: string } =>
        !!p &&
        typeof (p as { partNumber?: unknown }).partNumber === "number" &&
        typeof (p as { etag?: unknown }).etag === "string",
    )
    .sort((a, b) => a.partNumber - b.partNumber)
    .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag }));

  if (!hasS3Credentials(env)) {
    return stagingUnavailableResponse();
  }

  try {
    const client = getS3Client(env);
    const bucket = getS3Bucket(env);
    const completed = await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: sorted },
      }),
    );

    return Response.json({
      key,
      location: completed.Location ?? "",
      etag: completed.ETag ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Complete upload failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export const POST = withSentryRoute("multipart_complete", postMultipartComplete);
