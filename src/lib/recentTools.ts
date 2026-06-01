const STORAGE_KEY = "pt-recent-tool-slugs";
const MAX = 12;

function readStoredSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStoredSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Drop stale slugs that no longer map to a live tool. */
export function pruneRecentToolSlugs(validSlugs: Set<string>): string[] {
  const pruned = readStoredSlugs().filter((s) => validSlugs.has(s));
  if (pruned.length !== readStoredSlugs().length) {
    writeStoredSlugs(pruned);
  }
  return pruned;
}

export function recordRecentToolSlug(slug: string) {
  if (typeof window === "undefined" || !slug?.trim()) return;
  try {
    const prev = readStoredSlugs();
    const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX);
    writeStoredSlugs(next);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getRecentToolSlugs(limit = 3): string[] {
  return readStoredSlugs().filter(Boolean).slice(0, limit);
}
