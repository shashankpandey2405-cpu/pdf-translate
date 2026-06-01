import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getAppEnv } from "@/server/types";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import { verifyMultipartUploadToken } from "@/server/multipartUploadToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postMultipartAbort(req: Request) {
  const env = getAppEnv();
  let body: { key?: unknown; uploadId?: unknown; uploadToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const key = typeof body.key === "string" ? body.key : "";
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  const uploadToken = typeof body.uploadToken === "string" ? body.uploadToken : "";
  if (!key || !uploadId || !uploadToken) {
    return Response.json({ error: "key, uploadId and uploadToken are required" }, { status: 400 });
  }

  const verified = verifyMultipartUploadToken(uploadToken, key, uploadId);
  if (!verified.ok) {
    return Response.json({ error: "forbidden", message: "Invalid upload session." }, { status: 403 });
  }

  if (!hasS3Credentials(env)) {
    return stagingUnavailableResponse();
  }

  try {
    const client = getS3Client(env);
    const bucket = getS3Bucket(env);
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
      }),
    );
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Abort upload failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export const POST = withSentryRoute("multipart_abort", postMultipartAbort);
