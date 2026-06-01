import { getAppEnv } from "@/server/types";
import { envFlagTrue } from "@/server/strings";
import { hasS3Credentials } from "@/server/s3";
import { getSessionUser } from "@/server/sessionUser";
import { deleteStagedKeysFromBucket } from "@/server/r2ImmediatePurge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const env = getAppEnv();
  const user = await getSessionUser(req, env);
  const allowAnonCleanup = envFlagTrue(env.PUBLIC_FREE_SUITE);
  if (!user && !allowAnonCleanup) {
    return Response.json({ error: "unauthorized", message: "Sign in to delete staged uploads." }, { status: 401 });
  }
  let body: { keys?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const raw = body.keys;
  if (!Array.isArray(raw)) {
    return Response.json({ error: "keys must be an array" }, { status: 400 });
  }
  if (raw.length > 100) {
    return Response.json({ error: "too_many_keys" }, { status: 400 });
  }
  const keys: string[] = [];
  const userId = user?.id;
  for (const item of raw) {
    if (typeof item !== "string" || !item.trim()) continue;
    const key = item.trim();
    if (!key.startsWith("staging/") && !key.startsWith("uploads/")) {
      return Response.json({ error: "invalid_key", message: "Only staging/ and uploads/ keys are allowed." }, { status: 400 });
    }
    if (!userId) {
      if (!key.startsWith("staging/anon/") && !key.startsWith("uploads/anon/")) {
        return Response.json({ error: "forbidden", message: "Anonymous users can only delete their own files." }, { status: 403 });
      }
    } else {
      if (!key.startsWith(`staging/${userId}/`) && !key.startsWith(`uploads/${userId}/`) &&
          !key.startsWith("staging/anon/") && !key.startsWith("uploads/anon/")) {
        return Response.json({ error: "forbidden", message: "You can only delete your own files." }, { status: 403 });
      }
    }
    keys.push(key);
  }
  if (!keys.length) {
    return Response.json({ ok: true, deleted: 0 });
  }
  if (!hasS3Credentials(env)) {
    return Response.json({ error: "r2_unavailable" }, { status: 503 });
  }
  const deleted = await deleteStagedKeysFromBucket(env, keys);
  return Response.json({ ok: true, deleted });
}
