import { stageFilesForToolProcessing, deleteStagedKeys } from "@/lib/chunkedUpload";
import { isPrivacyFirstMode } from "@/lib/trustShield/storage";
import { toast } from "@/hooks/use-toast";
import { assertLocalProcessRateLimit } from "@/lib/enhanced/localRateLimit";

const LARGE_IN_BROWSER_MB = 85;

export type TieredStagingProgress = (uploadedBytes: number, totalBytes: number) => void;

function warnLargeBrowser(files: File[]) {
  const maxBytes = files.length ? Math.max(...files.map((f) => f.size)) : 0;
  if (maxBytes >= LARGE_IN_BROWSER_MB * 1024 * 1024) {
    toast({
      title: "Large document",
      description: "Very large files use a lot of browser memory. Close other tabs if processing feels slow.",
    });
  }
}

/**
 * Stage uploads to Cloudflare R2 when required (see `server/uploadPolicy.ts` + `/api/r2/*`), run `work`,
 * then best-effort delete any staged R2 keys so short-lived uploads do not linger.
 */
export async function runTieredThenCleanup<T>(
  files: File[],
  options: { onProgress?: TieredStagingProgress },
  work: () => Promise<T>,
): Promise<T> {
  warnLargeBrowser(files);
  await assertLocalProcessRateLimit();
  if (isPrivacyFirstMode()) {
    return work();
  }
  const keys = await stageFilesForToolProcessing(files, {
    onProgress: options.onProgress,
  });
  try {
    return await work();
  } finally {
    void deleteStagedKeys(keys);
  }
}

/** Stage only; returns R2 keys for callers that manage cleanup themselves. */
export async function runTieredStagingForFiles(
  files: File[],
  options?: { onProgress?: TieredStagingProgress },
): Promise<string[]> {
  warnLargeBrowser(files);
  return stageFilesForToolProcessing(files, {
    onProgress: options?.onProgress,
  });
}

export async function withStagedCleanup<T>(keys: string[], fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } finally {
    void deleteStagedKeys(keys);
  }
}
