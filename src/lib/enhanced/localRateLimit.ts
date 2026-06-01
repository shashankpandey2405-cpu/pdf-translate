/** Best-effort browser-local processing rate limit (server Redis buckets). */
export async function assertLocalProcessRateLimit(): Promise<void> {
  try {
    const res = await fetch("/api/enhanced/local-rate", {
      method: "POST",
      credentials: "include",
    });
    if (res.status === 429) {
      const data = await res.json();
      throw new Error(data.reason ?? "Rate limit exceeded");
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Rate limit")) throw e;
    // Redis unavailable — do not block local processing.
  }
}
