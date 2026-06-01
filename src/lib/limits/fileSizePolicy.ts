/** Signed-in free cloud trial upload cap (AI, enhanced). */
export const FREE_MAX_FILE_MB = 15;
/** Paid subscription upload cap. */
export const PREMIUM_MAX_FILE_MB = 500;

export function maxFileBytesForTier(isPremium: boolean): number {
  return (isPremium ? PREMIUM_MAX_FILE_MB : FREE_MAX_FILE_MB) * 1024 * 1024;
}

export function maxFileMbForTier(isPremium: boolean): number {
  return isPremium ? PREMIUM_MAX_FILE_MB : FREE_MAX_FILE_MB;
}

export type FileSizeCheck =
  | { ok: true }
  | { ok: false; reason: "too_large"; sizeMb: number; limitMb: number; suggestCompress: boolean };

export function checkFileSizeForTier(file: File, isPremium: boolean): FileSizeCheck {
  const limitMb = maxFileMbForTier(isPremium);
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb <= limitMb) return { ok: true };
  return {
    ok: false,
    reason: "too_large",
    sizeMb,
    limitMb,
    suggestCompress: !isPremium && sizeMb > FREE_MAX_FILE_MB,
  };
}

