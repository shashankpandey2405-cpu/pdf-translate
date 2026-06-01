import type { AppEnv } from "./types";
import { envFlagTrue } from "./strings";
import { isProductAuthOnly } from "./productAuthOnly";
import { resolveIsPremium } from "./premiumEntitlement";

export const MB = 1024 * 1024;
export const TIER_CLIENT_MAX = 20 * MB;
export const TIER_PRESIGNED_PUT_MAX = 35 * MB;
export const TIER_MAX_UPLOAD = 60 * MB;
export const TIER_PREMIUM_MAX_UPLOAD = 500 * MB;

const AUTH_SESSION_COOKIE_HINTS = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
];

export function hasAuthSessionCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  return AUTH_SESSION_COOKIE_HINTS.some((name) => cookieHeader.includes(`${name}=`));
}

/** Supabase SSR auth cookies (`sb-*-auth-token`). */
export function hasSupabaseAuthCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/.test(cookieHeader);
}

export function hasAnyAuthCookie(cookieHeader: string | undefined): boolean {
  return hasAuthSessionCookie(cookieHeader) || hasSupabaseAuthCookie(cookieHeader);
}

/** @deprecated Client-forgeable; do not use for authorization. UI hint only. */
export function hasPremiumCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  return /(?:^|;\s*)pt_premium=1(?:;|$)/.test(cookieHeader);
}

export async function resolveMaxUploadBytes(req: Request, env: AppEnv): Promise<number> {
  const isPremium = await resolveIsPremium(req, env);
  return isPremium ? TIER_PREMIUM_MAX_UPLOAD : TIER_MAX_UPLOAD;
}

export type UploadPolicyError = {
  status: number;
  code: string;
  message: string;
};

export function checkR2UploadPolicy(
  env: AppEnv,
  fileSize: number,
  cookieHeader: string | undefined,
  maxBytes: number = TIER_MAX_UPLOAD,
): UploadPolicyError | null {
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { status: 400, code: "invalid_size", message: "fileSize is required" };
  }
  if (fileSize > maxBytes) {
    return {
      status: 413,
      code: "file_too_large",
      message:
        maxBytes >= TIER_PREMIUM_MAX_UPLOAD
          ? "Premium limit is 500MB per file. Please split or compress your document."
          : "For speed and security, we support up to 50MB for free. Please compress your file and try again!",
    };
  }
  if (fileSize > TIER_CLIENT_MAX) {
    const allowAnonymousLarge = envFlagTrue(env.PUBLIC_FREE_SUITE) || isProductAuthOnly(env);
    if (!allowAnonymousLarge && !hasAnyAuthCookie(cookieHeader)) {
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

export function assertPresignedPutRange(
  fileSize: number,
  maxBytes: number = TIER_MAX_UPLOAD,
): UploadPolicyError | null {
  if (fileSize > maxBytes) {
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

export function assertMultipartMinSize(
  fileSize: number,
  maxBytes: number = TIER_MAX_UPLOAD,
): UploadPolicyError | null {
  if (fileSize > maxBytes) {
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
