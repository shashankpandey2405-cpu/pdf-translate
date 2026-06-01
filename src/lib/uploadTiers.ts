/** Byte thresholds for R2 staging (aligned with `server/uploadPolicy.ts` + `/api/r2/*`). */
export const MB = 1024 * 1024;
/** ≤20MB: process in the browser only — do not call R2 presign/multipart. */
export const TIER_CLIENT_MAX = 20 * MB;
/** (20MB, 35MB]: single presigned PUT to R2. */
export const TIER_PRESIGNED_PUT_MAX = 35 * MB;
/** (35MB, 60MB]: multipart upload to R2 for signed-in free tier. */
export const TIER_MAX_UPLOAD = 60 * MB;
/** Paid Premium ceiling — multipart parts scale on server for files >100MB. */
export const TIER_PREMIUM_MAX_UPLOAD = 500 * MB;

export const SIZE_EXCEEDS_CLOUD_MAX =
  "Free cloud trial supports up to 15MB per file. Please compress your file or upgrade to Premium.";

export const SIZE_EXCEEDS_PREMIUM_MAX =
  "Premium supports up to 500MB per file. Please split or compress larger documents.";

/** @deprecated Use SIZE_EXCEEDS_CLOUD_MAX */
export const SIZE_EXCEEDS_50MB = SIZE_EXCEEDS_CLOUD_MAX;

export function maxUploadBytesForTier(isPremium: boolean, isSignedIn: boolean): number {
  if (isPremium) return TIER_PREMIUM_MAX_UPLOAD;
  if (isSignedIn) return TIER_MAX_UPLOAD;
  return TIER_CLIENT_MAX;
}

export function sizeExceedsUploadMessage(isPremium: boolean): string {
  return isPremium ? SIZE_EXCEEDS_PREMIUM_MAX : SIZE_EXCEEDS_CLOUD_MAX;
}

export function needsR2Staging(file: File, maxUploadBytes: number = TIER_MAX_UPLOAD): boolean {
  return file.size > TIER_CLIENT_MAX && file.size <= maxUploadBytes;
}

export function needsMultipartUpload(file: File, maxUploadBytes: number = TIER_MAX_UPLOAD): boolean {
  return file.size > TIER_PRESIGNED_PUT_MAX && file.size <= maxUploadBytes;
}
