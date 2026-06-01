/** Download enhanced job output via same-origin API (never direct R2 in browser). */
export async function fetchEnhancedResultBlob(
  downloadUrl: string,
  opts?: { timeoutMs?: number; retries?: number; jobId?: string },
): Promise<Blob> {
  const timeoutMs = opts?.timeoutMs ?? 90_000;
  const retries = opts?.retries ?? 2;

  let url = downloadUrl;
  if (
    typeof window !== "undefined" &&
    url.includes("r2.cloudflarestorage.com") &&
    opts?.jobId
  ) {
    url = `/api/enhanced/jobs/${opts.jobId}/download`;
  }

  const sameOrigin =
    url.startsWith("/") ||
    (typeof window !== "undefined" && url.startsWith(window.location.origin));

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...(sameOrigin ? { credentials: "include" as const } : {}),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(
          res.status === 409
            ? "Your file is still being prepared. Please wait a moment and try again."
            : `Failed to download cloud result (HTTP ${res.status})`,
        );
      }
      return await res.blob();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        continue;
      }
    } finally {
      window.clearTimeout(timer);
    }
  }

  if (lastErr instanceof DOMException && lastErr.name === "AbortError") {
    throw new Error("Download timed out. Your file may still be ready — try Download again.");
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to download cloud result");
}
