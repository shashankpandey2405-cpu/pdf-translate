import { processAiQueueBatch } from "@/server/ai/queueWorker";
import { isAiConfigured } from "@/server/ai/config";
import { getQueueDepth } from "@/server/enhanced/redis";
import { envString } from "@/server/env";
import { safeEqualString } from "@/server/crypto/timingSafe";
import { verifyWorkerSecret } from "@/server/workerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorizeWorkerPing(req: Request): boolean {
  const secret = envString("RAILWAY_AI_WORKER_SECRET") || envString("RENDER_WORKER_SECRET");
  if (!secret) return true;
  if (verifyWorkerSecret(req.headers.get("x-worker-secret"))) return true;
  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth;
  return Boolean(bearer && safeEqualString(bearer, secret));
}

async function handlePing(req: Request) {
  if (!authorizeWorkerPing(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isAiConfigured()) {
    return Response.json({ ok: false, error: "ai_not_configured" }, { status: 503 });
  }
  const depth = await getQueueDepth("ai");
  const result = await processAiQueueBatch(1);
  return Response.json({ ok: true, queueDepth: depth, ...result });
}

export async function GET(req: Request) {
  return handlePing(req);
}

export async function POST(req: Request) {
  return handlePing(req);
}
