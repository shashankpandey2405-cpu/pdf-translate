import { envString } from "@/server/env";

/** Auth headers for Vercel → internal worker routes (ai-process, health). */
export function internalWorkerAuthHeaders(): Record<string, string> {
  const secret =
    envString("CRON_SECRET")?.trim() ||
    envString("RENDER_WORKER_SECRET")?.trim() ||
    envString("RAILWAY_AI_WORKER_SECRET")?.trim() ||
    "";
  if (!secret) return {};
  return {
    Authorization: `Bearer ${secret}`,
    "x-worker-secret": secret,
  };
}

export async function postInternalWorker(
  url: string,
  opts?: { timeoutMs?: number; label?: string },
): Promise<{ ok: boolean; status: number; body?: string }> {
  const timeoutMs = opts?.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...internalWorkerAuthHeaders(), "content-type": "application/json" },
      signal: controller.signal,
    });
    const body = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(
        `[worker-fetch] ${opts?.label ?? url} failed status=${res.status} body=${body.slice(0, 200)}`,
      );
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error(`[worker-fetch] ${opts?.label ?? url} error:`, err);
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}
