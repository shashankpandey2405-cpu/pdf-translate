/**
 * Runtime configuration for Next.js API routes (replaces Cloudflare Worker `Env` bindings).
 * R2 is accessed only via S3-compatible endpoints using access keys.
 */
import { getAppEnvSafe } from "./env";

export type AppEnv = {
  DATABASE_URL?: string;
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
  PUBLIC_FREE_SUITE?: string;
  S3_ENDPOINT?: string;
  S3_REGION?: string;
  S3_BUCKET?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  SENTRY_DSN?: string;
  VITE_SENTRY_DSN?: string;
  SENTRY_AUTH_TOKEN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
  SENTRY_TRACES_SAMPLE_RATE?: string;
  SENTRY_REPLAY_SESSION_SAMPLE_RATE?: string;
  SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE?: string;
  SENTRY_DISABLED?: string;
  CRON_SECRET?: string;
};

export function getAppEnv(): AppEnv {
  return getAppEnvSafe();
}
