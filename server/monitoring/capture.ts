import * as Sentry from "@sentry/nextjs";
import { isSentryDisabled } from "../../sentry.shared";
import { pipelineTagsForApi, toSentryTagRecord } from "../../src/monitoring/pipelineContext";

export type ApiExceptionContext = {
  api_name: string;
  route_name?: string;
  method?: string;
  duration_ms?: number;
  status_code?: number;
  tool_name?: string;
  pipeline_stage?: string;
  queue_name?: string;
  extra?: Record<string, unknown>;
};

/** Fire-and-forget server exception capture; no-op without DSN. */
export function captureApiException(error: unknown, ctx: ApiExceptionContext): void {
  if (isSentryDisabled()) return;
  const err = error instanceof Error ? error : new Error(String(error));
  const tags = toSentryTagRecord(
    pipelineTagsForApi(ctx.api_name, {
      route_name: ctx.route_name ?? ctx.api_name,
      tool_name: ctx.tool_name,
      pipeline_stage: ctx.pipeline_stage,
      queue_name: ctx.queue_name,
    }),
  );
  if (ctx.duration_ms !== undefined && ctx.duration_ms > 3000) {
    tags.performance_issue = "slow_api";
  }
  Sentry.captureException(err, {
    tags,
    extra: {
      method: ctx.method,
      duration_ms: ctx.duration_ms,
      status_code: ctx.status_code,
      ...ctx.extra,
    },
  });
}

export function captureServerException(
  error: unknown,
  tags: Record<string, string>,
  extra?: Record<string, unknown>,
): void {
  if (isSentryDisabled()) return;
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, { tags, extra });
}

export function addServerBreadcrumb(
  message: string,
  data?: Record<string, string | number | boolean>,
): void {
  if (isSentryDisabled()) return;
  Sentry.addBreadcrumb({
    category: "server",
    message,
    level: "info",
    data,
  });
}
