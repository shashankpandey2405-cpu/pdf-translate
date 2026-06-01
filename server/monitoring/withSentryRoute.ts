import * as Sentry from "@sentry/nextjs";
import { isSentryDisabled } from "../../sentry.shared";
import { captureApiException } from "./capture";

const SLOW_API_MS = 3000;

type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

/**
 * Wraps a Route Handler with performance timing and slow-API tagging.
 * Does not change response bodies or status codes.
 */
export function withSentryRoute(apiName: string, handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const start = Date.now();
    const method = req.method;

    if (isSentryDisabled()) {
      return handler(req, ctx);
    }

    return Sentry.startSpan(
      {
        name: apiName,
        op: "http.server",
        attributes: {
          "http.method": method,
          api_name: apiName,
        },
      },
      async (span) => {
        try {
          const res = await handler(req, ctx);
          const duration_ms = Date.now() - start;
          span.setAttribute("http.status_code", res.status);
          span.setAttribute("duration_ms", duration_ms);
          if (duration_ms > SLOW_API_MS) {
            Sentry.setTag("performance_issue", "slow_api");
            Sentry.addBreadcrumb({
              category: "api.slow",
              message: `${apiName} ${duration_ms}ms`,
              level: "warning",
              data: { api_name: apiName, duration_ms, method },
            });
          }
          return res;
        } catch (error) {
          const duration_ms = Date.now() - start;
          captureApiException(error, {
            api_name: apiName,
            route_name: apiName,
            method,
            duration_ms,
          });
          const message = error instanceof Error ? error.message : "server_error";
          return Response.json(
            { error: "server_error", message: message || "Request failed." },
            { status: 500 },
          );
        }
      },
    );
  };
}
