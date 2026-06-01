import { paypalApiBase, paypalClientId, paypalClientSecret } from "@/server/payments/paypal/config";

type TokenCache = { token: string; expiresAt: number };
let cache: TokenCache | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + 60_000) return cache.token;

  const clientId = paypalClientId();
  const secret = paypalClientSecret();
  if (!clientId || !secret) throw new Error("paypal_not_configured");

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || "paypal_token_failed");
  }

  cache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

export async function paypalApi<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = await getPayPalAccessToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  const body = init.json !== undefined ? JSON.stringify(init.json) : init.body;
  const res = await fetch(`${paypalApiBase()}${path}`, { ...init, headers, body });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.message || data.error || `paypal_api_${res.status}`);
  }
  return data;
}

export function findApproveLink(links: Array<{ rel?: string; href?: string }> | undefined): string | null {
  const link = links?.find((l) => l.rel === "approve" || l.rel === "payer-action");
  return link?.href ?? null;
}
