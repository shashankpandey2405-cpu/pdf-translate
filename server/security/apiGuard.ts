import { getClientIp, getUserAgent, shouldBlockApiRequest } from "@/server/security/botGuard";
import { assertApiBurstLimit } from "@/server/security/apiBurstLimit";

export type ApiGuardOptions = {
  /** Redis key suffix, e.g. "presign" */
  burstBucket: string;
  /** Max requests per IP per hour for this bucket */
  ipHourlyMax?: number;
};

const DEFAULT_IP_HOURLY = 120;

export function apiBotBlockedResponse(reason = "Automated requests are not allowed on this endpoint."): Response {
  return Response.json({ error: "forbidden", message: reason }, { status: 403 });
}

export function apiRateLimitedResponse(message: string): Response {
  return Response.json({ error: "RATE_LIMIT", message }, { status: 429 });
}

/** Bot UA check + optional per-IP hourly burst (server-side; cannot be bypassed from browser). */
export async function runApiGuard(req: Request, opts?: ApiGuardOptions): Promise<Response | null> {
  const url = new URL(req.url);
  const ua = getUserAgent(req);
  if (shouldBlockApiRequest(url.pathname, ua)) {
    return apiBotBlockedResponse();
  }

  const ip = getClientIp(req);
  const bucket = opts?.burstBucket ?? "api";
  const max = opts?.ipHourlyMax ?? DEFAULT_IP_HOURLY;
  const burst = await assertApiBurstLimit(`burst:ip:${bucket}:${ip}`, max, 3600);
  if (!burst.ok) {
    return apiRateLimitedResponse(burst.message);
  }
  return null;
}
