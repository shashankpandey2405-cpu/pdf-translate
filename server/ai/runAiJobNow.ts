import { processAiJob, type AiJobOptions } from "@/server/ai/processor";

/** Process one AI job inline (Vercel drain mode only). */
export async function runAiJobNow(params: {
  jobId: string;
  inputR2Key: string;
  options: AiJobOptions;
  traceId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await processAiJob(params.jobId, params.inputR2Key, params.options, params.traceId);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
