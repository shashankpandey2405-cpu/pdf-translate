import { processAiQueueBatch } from "@/server/ai/queueWorker";
import { isAiConfigured } from "@/server/ai/config";
import { envString } from "@/server/env";
import { safeEqualString } from "@/server/crypto/timingSafe";
import { verifyWorkerSecret } from "@/server/workerAuth";
import { isProductionDeployment, isServerQaBypassActive } from "@/server/qa/isQaMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeInternalAiRequest(req: Request): boolean {
  if (isServerQaBypassActive()) return true;

  const cron = envString("CRON_SECRET");
  const worker = envString("RENDER_WORKER_SECRET");
  if (!cron && !worker) return false;

  if (verifyWorkerSecret(req.headers.get("x-worker-secret"))) return true;

  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth;
  if (bearer && cron && safeEqualString(bearer, cron)) return true;
  if (bearer && worker && safeEqualString(bearer, worker)) return true;

  return false;
}

async function runAiWorker(req: Request) {
  const isProd = isProductionDeployment();

  if (isProd && !authorizeInternalAiRequest(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isServerQaBypassActive() && !isProd && !authorizeInternalAiRequest(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return Response.json({ ok: false, error: "ai_not_configured" }, { status: 503 });
  }

  const result = await processAiQueueBatch(3);
  return Response.json({ ok: true, ...result });
}

export async function GET(req: Request) {
  return runAiWorker(req);
}

export async function POST(req: Request) {
  return runAiWorker(req);
}
