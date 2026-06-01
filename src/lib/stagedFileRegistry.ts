/**
 * Tracks R2 staging/upload keys in sessionStorage so we can purge them on download,
 * tab hide/close, or when the result UI mounts if a prior cleanup missed them.
 */

const STORAGE_KEY = "pdftrusted:staged-r2-keys";

function filterSafeKeys(keys: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of keys) {
    if (typeof k !== "string" || !k.trim()) continue;
    const key = k.trim();
    if (!key.startsWith("staging/") && !key.startsWith("uploads/")) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function readKeys(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return filterSafeKeys(parsed as string[]);
  } catch {
    return [];
  }
}

function writeKeys(keys: string[]): void {
  if (typeof window === "undefined") return;
  if (!keys.length) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

/** Merge staging keys into the session registry (deduped). */
export function registerStagedKeys(keys: string[]): void {
  const safe = filterSafeKeys(keys);
  if (!safe.length) return;
  const merged = new Set([...readKeys(), ...safe]);
  writeKeys(Array.from(merged));
}

/** Remove keys from the registry after a confirmed delete (or local discard). */
export function unregisterStagedKeys(keys: string[]): void {
  const safe = new Set(filterSafeKeys(keys));
  if (!safe.size) return;
  const next = readKeys().filter((k) => !safe.has(k));
  writeKeys(next);
}

export function peekRegisteredStagedKeys(): string[] {
  return readKeys();
}

export function clearRegisteredStagedKeys(): void {
  writeKeys([]);
}

/** POST to delete-staged; returns whether the request succeeded. */
export async function postDeleteStagedKeys(keys: string[]): Promise<boolean> {
  const safe = filterSafeKeys(keys);
  if (!safe.length) return true;
  try {
    const response = await fetch("/api/r2/delete-staged", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: safe }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Async flush: delete everything still registered, clear registry on success.
 */
export async function flushRegisteredStagedKeys(): Promise<void> {
  const keys = readKeys();
  if (!keys.length) return;
  const ok = await postDeleteStagedKeys(keys);
  if (ok) clearRegisteredStagedKeys();
}

/**
 * For beforeunload / synchronous paths: fire delete with keepalive, then clear local registry.
 */
export function flushRegisteredStagedKeysSyncBestEffort(): void {
  const keys = readKeys();
  if (!keys.length) return;
  try {
    fetch("/api/r2/delete-staged", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
  clearRegisteredStagedKeys();
}
