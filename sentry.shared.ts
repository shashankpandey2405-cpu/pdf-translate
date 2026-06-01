/**
 * Shared Sentry helpers (client + server + edge). No Node-only imports.
 */
import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const SENSITIVE_KEY_RE =
  /password|secret|token|authorization|cookie|dsn|api[_-]?key|s3[_-]?|r2[_-]?|inputkey|outputkey|email|filename|filepath|file_path|content-type|multipart/i;

const R2_KEY_RE = /enhanced\/(input|output)\/[^\s]+/gi;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function isSentryDisabled(): boolean {
  if (process.env.SENTRY_DISABLED === "1" || process.env.SENTRY_DISABLED === "true") {
    return true;
  }
  const dsn =
    process.env.SENTRY_DSN?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
    process.env.VITE_SENTRY_DSN?.trim() ||
    "";
  return !dsn;
}

export function resolveSentryDsn(): string {
  return (
    process.env.SENTRY_DSN?.trim() ||
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
    process.env.VITE_SENTRY_DSN?.trim() ||
    ""
  );
}

export function resolveSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
}

export function resolveSentryRelease(): string | undefined {
  const release =
    process.env.SENTRY_RELEASE?.trim() ||
    process.env.NEXT_PUBLIC_APP_RELEASE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.VITE_APP_RELEASE?.trim();
  return release || undefined;
}

export function parseSampleRate(envKey: string, fallback: number): number {
  const raw = process.env[envKey]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return fallback;
  return n;
}

function scrubString(value: string): string {
  return value.replace(R2_KEY_RE, "[r2_key_redacted]").replace(EMAIL_RE, "[email_redacted]");
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_RE.test(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = scrubValue(v, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

export function scrubSentryEvent<T extends ErrorEvent>(event: T): T | null {
  if (event.request) {
    delete event.request.cookies;
    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const key of Object.keys(headers)) {
        if (SENSITIVE_KEY_RE.test(key)) headers[key] = "[redacted]";
      }
      event.request.headers = headers;
    }
    if (typeof event.request.url === "string") {
      try {
        const u = new URL(event.request.url);
        u.search = "";
        event.request.url = u.toString();
      } catch {
        event.request.url = scrubString(event.request.url);
      }
    }
  }

  if (event.extra) {
    event.extra = scrubValue(event.extra) as Record<string, unknown>;
  }
  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as typeof event.contexts;
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => ({
      ...b,
      message: b.message ? scrubString(b.message) : b.message,
      data: b.data ? (scrubValue(b.data) as Record<string, unknown>) : b.data,
    }));
  }
  if (event.exception?.values) {
    for (const ex of event.exception.values) {
      if (ex.value) ex.value = scrubString(ex.value);
    }
  }

  return event;
}

export function beforeSendScrub(event: ErrorEvent, _hint: EventHint): ErrorEvent | null {
  if (shouldIgnoreError(event)) return null;
  return scrubSentryEvent(event);
}

const IGNORE_MESSAGES = [
  "ResizeObserver loop",
  "Non-Error promise rejection captured",
  "AbortError",
  "The user aborted a request",
  "Load failed",
  "Failed to fetch",
  "NetworkError",
  "chrome-extension://",
  "moz-extension://",
  "Minified React error #418",
  "Hydration failed",
  "removeChild",
  "NotFoundError",
  "There was an error while hydrating",
];

function shouldIgnoreError(event: ErrorEvent): boolean {
  const message =
    event.exception?.values?.[0]?.value ||
    event.message ||
    event.logentry?.message ||
    "";
  if (!message) return false;
  return IGNORE_MESSAGES.some((frag) => message.includes(frag));
}

export const denyUrls = [
  /extensions\//i,
  /^chrome:\/\//i,
  /^moz-extension:\/\//i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  /doubleclick\.net/i,
];
