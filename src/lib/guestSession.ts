const STORAGE_KEY = "pdftrusted:guest-id";

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `g_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

/** Anonymous session id for lightweight analytics/support correlation (no PII). */
export function getOrCreateGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = randomId();
    sessionStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return null;
  }
}
