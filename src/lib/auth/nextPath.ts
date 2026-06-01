export const DEFAULT_POST_LOGIN_PATH = "/en/all-tools";

const BLOCKED_PATH_RE = /^\/\/|^\/\\|@|\\\\/;

/** Normalize post-login target to a path (never a full URL in OAuth redirectTo). */
export function normalizeNextPath(nextPath?: string | null): string {
  const raw = (nextPath ?? DEFAULT_POST_LOGIN_PATH).trim();
  if (!raw) return DEFAULT_POST_LOGIN_PATH;

  if (BLOCKED_PATH_RE.test(raw) || raw.includes("\\")) {
    return DEFAULT_POST_LOGIN_PATH;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      if (!host || host === "localhost") {
        return url.pathname + url.search || DEFAULT_POST_LOGIN_PATH;
      }
      return DEFAULT_POST_LOGIN_PATH;
    } catch {
      return DEFAULT_POST_LOGIN_PATH;
    }
  }

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  if (BLOCKED_PATH_RE.test(path) || path.includes("://") || path.includes("\\")) {
    return DEFAULT_POST_LOGIN_PATH;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return DEFAULT_POST_LOGIN_PATH;
  return path;
}

export function buildOAuthRedirectTo(origin: string, nextPath?: string): string {
  const path = normalizeNextPath(nextPath);
  const base = `${origin}/auth/callback`;
  if (path === DEFAULT_POST_LOGIN_PATH) return base;
  return `${base}?next=${encodeURIComponent(path)}`;
}
