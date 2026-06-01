import { envString } from "@/server/env";
import { signWorkerPayload } from "@/server/workerAuth";

const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 3000, 9000];

export async function postAiWorkerCallback(body: {
  jobId: string;
  status: string;
  outputR2Key?: string;
  errorCode?: string;
  errorMessage?: string;
  progress?: number;
  traceId?: string;
}): Promise<void> {
  const base = envString("ENHANCED_CALLBACK_URL") || envString("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  const normalizedBase =
    base.replace(/\/$/, "") === "https://pdftrusted.com" ? "https://www.pdftrusted.com" : base.replace(/\/$/, "");
  const secret = envString("RENDER_WORKER_SECRET");
  const url = `${normalizedBase}/api/enhanced/worker/callback`;
  const sig = signWorkerPayload(body.jobId, body.status, body.outputR2Key);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["x-worker-secret"] = secret;
    headers["x-worker-signature"] = sig;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = BACKOFF_MS[attempt - 1] ?? 3000;
        console.info(`[worker-callback] retry ${attempt}/${MAX_RETRIES} after ${delay}ms for jobId=${body.jobId}`);
        await new Promise((r) => setTimeout(r, delay));
      }

      console.info(`[worker-callback] POST ${url} status=${body.status} jobId=${body.jobId} attempt=${attempt + 1}`);
      const res = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(15_000),
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        console.info(`[worker-callback] OK jobId=${body.jobId}`);
        return;
      }

      const t = await res.text();
      lastError = new Error(`callback_failed: ${res.status} ${t.slice(0, 200)}`);
      console.error(`[worker-callback] FAILED ${res.status}: ${t.slice(0, 200)}`);

      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw lastError;
      }
    } catch (e) {
      if (e instanceof Error && e.name === "TimeoutError") {
        lastError = new Error(`callback_timeout: request timed out after 15s`);
        console.error(`[worker-callback] TIMEOUT for jobId=${body.jobId} attempt=${attempt + 1}`);
      } else if (e === lastError) {
        throw e;
      } else {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.error(`[worker-callback] ERROR attempt=${attempt + 1}:`, lastError.message);
      }
    }
  }

  throw lastError ?? new Error("callback_failed: all retries exhausted");
}
