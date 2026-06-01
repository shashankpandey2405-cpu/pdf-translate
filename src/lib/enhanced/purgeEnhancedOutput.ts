/** Client: request server purge of enhanced R2 keys (instant permanent delete). */
export type CloudPurgeMeta = {
  jobId: string;
  inputR2Key?: string;
  outputR2Key?: string;
};

export type PurgeEnhancedResult = { ok: true; error?: string } | { ok: false; error?: string };

export async function purgeEnhancedOutput(input: CloudPurgeMeta): Promise<PurgeEnhancedResult> {
  try {
    const res = await fetch("/api/enhanced/purge-output", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) return { ok: true };
    let error: string | undefined;
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      error = data.error || data.message;
    } catch {
      /* ignore */
    }
    return { ok: false, error: error || res.statusText || "Request failed" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
