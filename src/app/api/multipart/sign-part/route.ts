import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAppEnv } from "@/server/types";
import { stagingUnavailableResponse } from "@/server/apiResponses";
import { getS3Bucket, getS3Client, hasS3Credentials } from "@/server/s3";
import { verifyMultipartUploadToken } from "@/server/multipartUploadToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postMultipartSignPart(req: Request) {
  const env = getAppEnv();
  let body: { key?: unknown; uploadId?: unknown; partNumber?: unknown; uploadToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const key = typeof body.key === "string" ? body.key : "";
  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  const uploadToken = typeof body.uploadToken === "string" ? body.uploadToken : "";
  const partNumber = typeof body.partNumber === "number" ? body.partNumber : Number(body.partNumber);
  if (!key || !uploadId || !uploadToken || !Number.isFinite(partNumber)) {
    return Response.json(
      { error: "key, uploadId, uploadToken and partNumber are required" },
      { status: 400 },
    );
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
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    const url = await getSignedUrl(client, command, { expiresIn: 900 });
    return Response.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign part failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export const POST = withSentryRoute("multipart_sign_part", postMultipartSignPart);
