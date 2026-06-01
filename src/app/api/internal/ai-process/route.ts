import { processAiQueueBatch } from "@/server/ai/queueWorker";
import { isAiConfigured } from "@/server/ai/config";
import { envString } from "@/server/env";
import { safeEqualString } from "@/server/crypto/timingSafe";
import { verifyWorkerSecret } from "@/server/workerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeInternalAiRequest(req: Request): boolean {
  const cron = envString("CRON_SECRET");
  const worker = envString("RENDER_WORKER_SECRET");
  if (!cron && !worker) return true;

  if (verifyWorkerSecret(req.headers.get("x-worker-secret"))) return true;

  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth;
  if (bearer && cron && safeEqualString(bearer, cron)) return true;
  if (bearer && worker && safeEqualString(bearer, worker)) return true;

  return false;
}

async function runAiWorker(req: Request) {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

  if (isProd && !authorizeInternalAiRequest(req)) {
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
