import { captureApiException } from "@/server/monitoring/capture";

export type ApiErrorBody = {
  error: string;
  message: string;
  details?: string;
};

export function apiJson<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number; headers?: HeadersInit },
): Response {
  return Response.json(data, { status: init?.status ?? 200, headers: init?.headers });
}

export function apiError(
  code: string,
  message: string,
  status = 500,
  details?: string,
): Response {
  const body: ApiErrorBody = { error: code, message };
  if (details && process.env.NODE_ENV !== "production") {
    body.details = details.slice(0, 400);
  }
  return Response.json(body, { status });
}

/**
 * Wraps a route handler with consistent try/catch logging.
 */
export function withApiHandler(
  name: string,
  handler: (req: Request, ctx?: unknown) => Promise<Response>,
): (req: Request, ctx?: unknown) => Promise<Response> {
  return async (req, ctx) => {
    const start = Date.now();
    try {
      return await handler(req, ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[api:${name}]`, err);
      captureApiException(err, {
        api_name: name,
        route_name: name,
        method: req.method,
        duration_ms: Date.now() - start,
      });
      return apiError("internal_error", "Request failed. Please try again.", 500, msg);
    }
  };
}
