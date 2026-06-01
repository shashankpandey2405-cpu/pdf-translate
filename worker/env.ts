/**
 * Cloudflare Worker bindings + env vars for PDFTrusted.
 *
 * All Worker code receives `c.env` (Hono) or `env` (raw fetch handler) — never reads
 * `process.env` directly. This keeps the Worker portable and explicit about which
 * secrets each module touches.
 */

import type { R2Bucket, Fetcher } from "@cloudflare/workers-types";

export interface Env {
  // -- Bindings ------------------------------------------------------------
  /** Native R2 binding for the `pdftrusted` bucket (set in wrangler.toml). */
  PDFTRUSTED_R2: R2Bucket;
  /** Static assets fetcher (Vite SPA built into ./dist). */
  ASSETS: Fetcher;

  /** Optional SQL connection string (Neon, etc.) — prefer secrets, not committed values. */
  DATABASE_URL?: string;
  /** Documented for parity with Vite; Worker code typically ignores this. */
  VITE_API_PROXY_TARGET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SECRET?: string;
  NEXTAUTH_SECRET?: string;
  AUTH_TRUST_HOST?: string;
  AUTH_URL?: string;
  NEXTAUTH_URL?: string;
  AUTH_SIGNIN_PATH?: string;
  AUTH_ONLY_MODE?: string;
  /** When true, R2 staging for files >20MB does not require a signed-in session (public free tier). */
  PUBLIC_FREE_SUITE?: string;

  // -- S3-compatible presigned uploads (Cloudflare R2 via @aws-sdk) -------
  S3_ENDPOINT?: string;
  S3_REGION?: string;
  S3_BUCKET?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;

  // -- Email (Resend) ------------------------------------------------------
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;

  // -- Observability -------------------------------------------------------
  SENTRY_DSN?: string;
  VITE_SENTRY_DSN?: string;

  // -- Payments webhook ----------------------------------------------------
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;
}

/** Trim helper; returns undefined for empty values (so `??` chains work). */
export function val(v: string | undefined): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/** Convenience: bool-like env reading. */
export function envFlagTrue(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
}

export function envFlagFalse(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "false" || s === "0";
}
