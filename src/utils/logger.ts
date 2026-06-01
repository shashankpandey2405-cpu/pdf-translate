/**
 * Global monitoring: Sentry (errors + stack traces) + GA4 (funnels & tool outcomes).
 * Sentry.init runs in instrumentation-client.ts (Next) or fallback here (Vite dev).
 */
import * as Sentry from "@sentry/nextjs";
import {
  beforeSendScrub,
  denyUrls,
  isSentryDisabled,
  parseSampleRate,
  resolveSentryDsn,
  resolveSentryEnvironment,
  resolveSentryRelease,
} from "../../sentry.shared";
import { pipelineTagsFromToolSlug, toSentryTagRecord } from "@/monitoring/pipelineContext";
import { toast } from "@/hooks/use-toast";
import { ensurePersistentStorage } from "@/lib/storage/persistentStorage";
import { hasAnalyticsConsent, subscribeConsent } from "@/lib/consent";

const SENTRY_DSN = resolveSentryDsn();
const GA_MEASUREMENT_ID = (process.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || "";
const SENTRY_TUNNEL =
  (process.env.VITE_SENTRY_TUNNEL as string | undefined)?.trim() ||
  (process.env.NEXT_PUBLIC_SENTRY_TUNNEL as string | undefined)?.trim() ||
  undefined;

const ENTRY_REFERRER_KEY = "pt_entry_referrer";
const ENTRY_PATH_KEY = "pt_entry_path";

let monitoringBootstrapped = false;

function sentryReady(): boolean {
  return Boolean(SENTRY_DSN && !isSentryDisabled() && Sentry.getClient());
}

/** Vite SPA path: instrumentation-client.ts is not loaded — init once here. */
function initSentryClientFallback() {
  if (typeof window === "undefined" || isSentryDisabled() || Sentry.getClient()) return;

  const isProd = process.env.NODE_ENV === "production";
  const integrations = [
    Sentry.browserTracingIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ];
  if (isProd || process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1") {
    integrations.push(
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    );
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    tunnel: SENTRY_TUNNEL,
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
    sendDefaultPii: false,
    attachStacktrace: true,
    maxBreadcrumbs: 100,
    integrations,
    tracesSampleRate: parseSampleRate("SENTRY_TRACES_SAMPLE_RATE", isProd ? 0.12 : 1),
    replaysSessionSampleRate: parseSampleRate(
      "SENTRY_REPLAY_SESSION_SAMPLE_RATE",
      isProd ? 0.05 : 0,
    ),
    replaysOnErrorSampleRate: parseSampleRate("SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE", 1),
    denyUrls,
    beforeSend: beforeSendScrub,
  });
}

/** GA4 + internal events: slug `merge-pdf` → `merge_pdf` */
export function toolMetricPrefix(slug: string): string {
  return slug.replace(/\//g, "_").replace(/-/g, "_");
}

function journeySnapshot() {
  if (typeof window === "undefined") return {};
  try {
    const referrer = sessionStorage.getItem(ENTRY_REFERRER_KEY) || document.referrer || "direct";
    const entryPath = sessionStorage.getItem(ENTRY_PATH_KEY) || window.location.pathname;
    return {
      journey_referrer: referrer,
      journey_entry_path: entryPath,
      page_path: window.location.pathname,
      page_url: window.location.href,
    };
  } catch {
    return { journey_referrer: "unknown", journey_entry_path: "", page_path: "", page_url: "" };
  }
}

function rememberEntryOnce() {
  if (typeof window === "undefined") return;
  try {
    if (!sessionStorage.getItem(ENTRY_REFERRER_KEY)) {
      sessionStorage.setItem(ENTRY_REFERRER_KEY, document.referrer || "direct");
    }
    if (!sessionStorage.getItem(ENTRY_PATH_KEY)) {
      sessionStorage.setItem(ENTRY_PATH_KEY, window.location.pathname + window.location.search);
    }
  } catch {
    /* private mode */
  }
}

function pushGtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (GA_MEASUREMENT_ID && !hasAnalyticsConsent()) return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") {
    window.gtag(...(args as [unknown, ...unknown[]]));
  } else {
    window.dataLayer.push(args);
  }
}

let gaConsentUnsub: (() => void) | undefined;

function loadGaDeferred() {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!hasAnalyticsConsent()) {
    gaConsentUnsub?.();
    gaConsentUnsub = subscribeConsent(() => {
      if (hasAnalyticsConsent()) {
        gaConsentUnsub?.();
        gaConsentUnsub = undefined;
        loadGaDeferred();
      }
    });
    return;
  }
  const schedule = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
  schedule(() => {
    if (document.querySelector(`script[data-pt-ga="${GA_MEASUREMENT_ID}"]`)) return;
    const s = document.createElement("script");
    s.async = true;
    s.dataset.ptGa = GA_MEASUREMENT_ID;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    s.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer!.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: true,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    };
    document.head.appendChild(s);
  });
}

function initGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "error",
    (event) => {
      queueMicrotask(() => {
        const err =
          event.error instanceof Error
            ? event.error
            : new Error(String(event.message || "window.error"));
        if (sentryReady()) {
          Sentry.captureException(err, {
            tags: { error_channel: "window_error", route_name: window.location.pathname },
            extra: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              ...journeySnapshot(),
            },
          });
        }
        pushGtag("event", "javascript_error", {
          message: err.message,
          ...journeySnapshot(),
        });
      });
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    queueMicrotask(() => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason));
      if (sentryReady()) {
        Sentry.captureException(err, {
          tags: { error_channel: "unhandledrejection", route_name: window.location.pathname },
          extra: journeySnapshot(),
        });
      }
      pushGtag("event", "unhandled_promise_rejection", {
        message: err.message,
        ...journeySnapshot(),
      });
    });
  });
}

/** Call once at app startup (before React render). */
export function initMonitoring() {
  if (typeof window === "undefined" || monitoringBootstrapped) return;
  monitoringBootstrapped = true;
  rememberEntryOnce();
  initSentryClientFallback();

  if (sentryReady() && process.env.NODE_ENV !== "production") {
    Sentry.captureMessage("monitoring_bootstrap_ok", "info");
  }

  initGlobalErrorHandlers();
  loadGaDeferred();
  ensurePersistentStorage();
}

/** Update Sentry scope + optional GA virtual page when route changes (use inside Wouter). */
export function setRouteTags(pathname: string) {
  queueMicrotask(() => {
    if (sentryReady()) {
      Sentry.setTag("route", pathname);
      Sentry.setTag("route_name", pathname);
      Sentry.addBreadcrumb({
        category: "navigation",
        type: "navigation",
        message: pathname,
        level: "info",
      });
    }
    if (GA_MEASUREMENT_ID) {
      pushGtag("config", GA_MEASUREMENT_ID, {
        page_path: pathname,
        page_location: window.location.href,
        page_title: typeof document !== "undefined" ? document.title : "",
        send_page_view: true,
      });
    }
  });
}

/** Breadcrumb + lightweight GA signal for drop-off analysis (buttons, steps). */
export function trackInteraction(elementId: string, extra?: Record<string, string | number | boolean>) {
  queueMicrotask(() => {
    if (sentryReady()) {
      Sentry.addBreadcrumb({
        category: "ui.click",
        message: elementId,
        level: "info",
        data: { ...extra, ...journeySnapshot() },
      });
    }
    pushGtag("event", "ui_interaction", {
      element_id: elementId,
      ...extra,
      ...journeySnapshot(),
    });
  });
}

export type DriverHealthPayload = {
  library: string;
  tool_slug?: string;
  phase?: string;
  ok: boolean;
  error?: unknown;
};

export type ApiErrorPayload = {
  url: string;
  method?: string;
  statusCode?: number;
  tool_slug?: string;
  phase?: string;
  error: unknown;
};

export function logApiError(payload: ApiErrorPayload) {
  queueMicrotask(() => {
    const err = normalizeError(payload.error);
    const base = {
      url: payload.url,
      method: payload.method ?? "unknown",
      status_code: payload.statusCode ?? 0,
      tool_slug: payload.tool_slug ?? "",
      phase: payload.phase ?? "api_call",
      ...journeySnapshot(),
    };

    const tags = toSentryTagRecord(
      pipelineTagsFromToolSlug(payload.tool_slug ?? "n/a", payload.phase ?? "api_call", {
        API_name: payload.url,
      }),
    );
    tags.tool_slug = payload.tool_slug ?? "n/a";
    tags.api_url = payload.url;
    tags.api_method = payload.method ?? "unknown";
    tags.status_code = String(payload.statusCode ?? "unknown");

    if (sentryReady()) {
      Sentry.captureException(err, { tags, extra: { ...base } });
    }

    pushGtag("event", "api_error", {
      message: err.message,
      ...base,
    });
  });
}

export function logDriverHealth(payload: DriverHealthPayload) {
  queueMicrotask(() => {
    const base = {
      library: payload.library,
      tool_slug: payload.tool_slug ?? "",
      phase: payload.phase ?? "",
      ok: payload.ok,
      ...journeySnapshot(),
    };
    if (!payload.ok && payload.error !== undefined) {
      const err = payload.error instanceof Error ? payload.error : new Error(String(payload.error));
      if (sentryReady()) {
        Sentry.captureException(err, {
          tags: {
            driver: payload.library,
            conversion_engine: payload.library,
            tool_slug: payload.tool_slug ?? "n/a",
            tool_name: payload.tool_slug ?? "n/a",
            pipeline_stage: payload.phase ?? "unknown",
            failure_phase: payload.phase ?? "unknown",
          },
          extra: base,
        });
      }
    } else if (sentryReady()) {
      Sentry.addBreadcrumb({
        category: "driver",
        message: `${payload.library}:${payload.phase ?? "ok"}`,
        level: payload.ok ? "info" : "warning",
        data: base,
      });
    }
    pushGtag("event", "driver_health", {
      ...base,
      error_message:
        !payload.ok && payload.error instanceof Error
          ? payload.error.message
          : !payload.ok
            ? String(payload.error)
            : "",
    });
  });
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : JSON.stringify(error));
}

export type LogToolErrorOptions = Record<string, string | number | boolean | undefined> & {
  recoverable?: boolean;
  suppressToast?: boolean;
};

export function logToolError(
  toolSlug: string,
  step: string,
  error: unknown,
  extra?: LogToolErrorOptions,
) {
  queueMicrotask(() => {
    const err = normalizeError(error);
    const { recoverable, suppressToast, ...rest } = extra ?? {};
    const prefix = toolMetricPrefix(toolSlug);
    const eventName = `${prefix}_error`;
    const tags = toSentryTagRecord(pipelineTagsFromToolSlug(toolSlug, step, rest));
    tags.tool_slug = toolSlug;
    tags.failure_step = step;
    tags.recoverable = recoverable ? "true" : "false";

    if (sentryReady()) {
      Sentry.captureException(err, {
        level: recoverable ? "warning" : "error",
        tags,
        extra: {
          step,
          recoverable,
          ...rest,
          ...journeySnapshot(),
        },
      });
    }
    pushGtag("event", eventName, {
      failure_step: step,
      message: err.message,
      error_message: err.message,
      recoverable: recoverable ? 1 : 0,
      ...rest,
      ...journeySnapshot(),
    });
    if (recoverable && !suppressToast) {
      toast({
        title: "Processing hiccup",
        description: "Retrying in the browser usually fixes this. Try again or refresh the page.",
        variant: "destructive",
      });
    }
  });
}

/** Pipeline failure with standardized observability tags. */
export function logPipelineFailure(
  toolSlug: string,
  stage: string,
  error: unknown,
  extra?: LogToolErrorOptions & { file_type?: string; OCR_engine?: string; AI_provider?: string },
) {
  logToolError(toolSlug, stage, error, extra);
}

export function logToolSuccess(toolSlug: string, extra?: Record<string, string | number | boolean | undefined>) {
  queueMicrotask(() => {
    const prefix = toolMetricPrefix(toolSlug);
    const eventName = `${prefix}_success`;
    if (sentryReady()) {
      Sentry.addBreadcrumb({
        category: "tool",
        message: eventName,
        level: "info",
        data: { tool_slug: toolSlug, tool_name: toolSlug, ...extra, ...journeySnapshot() },
      });
    }
    pushGtag("event", eventName, {
      tool_slug: toolSlug,
      ...extra,
      ...journeySnapshot(),
    });
  });
}

/** Signup funnel & conversion UX events (Phase 4). */
export function logConversionEvent(
  name: string,
  extra?: Record<string, string | number | boolean | undefined>,
) {
  queueMicrotask(() => {
    pushGtag("event", name, {
      event_category: "conversion",
      ...extra,
      ...journeySnapshot(),
    });
  });
}

export { captureException, captureMessage } from "@sentry/nextjs";
