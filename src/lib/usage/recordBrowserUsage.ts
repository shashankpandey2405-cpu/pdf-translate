/** Report successful browser-only processing for usage rollups. */
export async function recordBrowserUsage(toolSlug: string, sessionId: string): Promise<void> {
  try {
    await fetch("/api/usage/browser", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolSlug, sessionId }),
    });
  } catch {
    /* non-blocking */
  }
}
