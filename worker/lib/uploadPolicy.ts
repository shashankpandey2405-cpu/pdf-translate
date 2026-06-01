/**
 * Tiered upload policy (must match `src/lib/uploadTiers.ts`).
 * ≤20MB: browser-only — do not use R2 presign/multipart.
 * (20MB, 35MB]: single presigned PUT to R2 (anonymous when PUBLIC_FREE_SUITE, else signed-in).
 * (35MB, 50MB]: multipart to R2 (same).
 * >50MB: rejected.
 */

import type { Env } from "../env";
import { envFlagTrue } from "../env";
import { isProductAuthOnly } from "./productAuthOnly";

export const MB = 1024 * 1024;
/** Inclusive — files at or below this size never hit R2 from the staging helper. */
export const TIER_CLIENT_MAX = 20 * MB;
/** Presigned single-PUT path for (TIER_CLIENT_MAX, TIER_PRESIGNED_PUT_MAX]. */
export const TIER_PRESIGNED_PUT_MAX = 35 * MB;
/** Hard cap for any upload / staging. */
export const TIER_MAX_UPLOAD = 60 * MB;

const AUTH_SESSION_COOKIE_HINTS = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
];

export function hasAuthSessionCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  return AUTH_SESSION_COOKIE_HINTS.some((name) => cookieHeader.includes(`${name}=`));
}

export function hasPremiumCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  return /(?:^|;\s*)pt_premium=1(?:;|$)/.test(cookieHeader);
}

export type UploadPolicyError = {
  status: number;
  code: string;
  message: string;
};

export function checkR2UploadPolicy(
  env: Env,
  fileSize: number,
  cookieHeader: string | undefined,
): UploadPolicyError | null {
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { status: 400, code: "invalid_size", message: "fileSize is required" };
  }
  if (fileSize > TIER_MAX_UPLOAD) {
    return {
      status: 413,
      code: "file_too_large",
      message:
        "For speed and security, we support up to 50MB for free. Please compress your file and try again!",
    };
  }
  if (fileSize > TIER_CLIENT_MAX) {
    const allowAnonymousLarge = envFlagTrue(env.PUBLIC_FREE_SUITE) || isProductAuthOnly(env);
    if (!allowAnonymousLarge && !hasAuthSessionCookie(cookieHeader)) {
      return {
        status: 401,
        code: "login_required",
        message: "Files over 20MB require a signed-in account for cloud staging.",
      };
    }
    return null;
  }
  return null;
}

export function assertPresignedPutRange(fileSize: number): UploadPolicyError | null {
  if (fileSize > TIER_MAX_UPLOAD) {
    return {
      status: 413,
      code: "file_too_large",
      message:
        "For speed and security, we support up to 50MB for free. Please compress your file and try again!",
    };
  }
  if (fileSize <= TIER_CLIENT_MAX) {
    return {
      status: 400,
      code: "client_only",
      message: "Files up to 20MB are processed in the browser; R2 staging is not used.",
    };
  }
  if (fileSize > TIER_PRESIGNED_PUT_MAX) {
    return {
      status: 400,
      code: "use_multipart",
      message: "Files over 35MB must use multipart upload.",
    };
  }
  return null;
}

export function assertMultipartMinSize(fileSize: number): UploadPolicyError | null {
  if (fileSize > TIER_MAX_UPLOAD) {
    return {
      status: 413,
      code: "file_too_large",
      message:
        "For speed and security, we support up to 50MB for free. Please compress your file and try again!",
    };
  }
  if (fileSize <= TIER_PRESIGNED_PUT_MAX) {
    return {
      status: 400,
      code: "use_single_put",
      message: "Multipart is only used for files over 35MB.",
    };
  }
  return null;
}
