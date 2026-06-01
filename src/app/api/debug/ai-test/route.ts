import { isAiConfigured, OPENROUTER_API_KEY, OPENROUTER_MODEL_FREE } from "@/server/ai/config";
import { modelChainForWorkload } from "@/server/ai/router";
import { drainAiQueueOnVercel } from "@/server/env/aiWorker";
import { isDebugRouteAllowed } from "@/server/security/debugAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TEST_PROMPT =
  "Summarize this text in 2 sentences: The driving learning permit is issued to individuals who are at least 18 years of age and have passed the theoretical driving test. The permit is valid for one year from the date of issue and allows the holder to practice driving under supervision.";

export async function GET(req: Request) {
  if (!isDebugRouteAllowed(req)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const keyExists = Boolean(OPENROUTER_API_KEY?.trim());
  const chain = modelChainForWorkload({ task: "summarize", pageCount: 1, totalChars: 2000 });
  const drainOnVercel = drainAiQueueOnVercel();

  const results: Array<{ model: string; ok: boolean; text?: string; error?: string; ms: number }> = [];

  if (keyExists) {
    for (const model of chain.slice(0, 4)) {
      const t0 = Date.now();
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(30_000),
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: TEST_PROMPT }],
            max_tokens: 100,
            temperature: 0.2,
          }),
        });
        const raw = await res.text();
        const ms = Date.now() - t0;
        if (res.ok) {
          const data = JSON.parse(raw);
          const text = data.choices?.[0]?.message?.content?.trim() || "(empty)";
          results.push({ model, ok: true, text: text.slice(0, 200), ms });
          break;
        } else {
          results.push({ model, ok: false, error: `${res.status}: ${raw.slice(0, 200)}`, ms });
        }
      } catch (e) {
        results.push({
          model,
          ok: false,
          error: e instanceof Error ? e.message : "fetch_failed",
          ms: Date.now() - t0,
        });
      }
    }
  }

  const firstSuccess = results.find((r) => r.ok);

  return Response.json({
    aiConfigured: isAiConfigured(),
    keyExists,
    drainOnVercel,
    freeModel: OPENROUTER_MODEL_FREE,
    modelChain: chain,
    testResults: results,
    working: Boolean(firstSuccess),
    workingModel: firstSuccess?.model || null,
  });
}
