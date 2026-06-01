import { getDeviceCapability } from "@/lib/deviceCapability";
import { isMobileSafari } from "@/lib/download/isIOS";

/** Max workspace entries kept locally. */
export const WORKSPACE_MAX_ENTRIES = 15;

/** Total blob budget across all entries on high-tier desktop (~500 MB). */
export const WORKSPACE_MAX_TOTAL_BYTES = 500 * 1024 * 1024;

/** Device-aware workspace blob budget — lower on iPhone / low RAM. */
export function getWorkspaceMaxTotalBytes(): number {
  const tier = getDeviceCapability().tier;
  if (isMobileSafari() || tier === "low") return 80 * 1024 * 1024;
  if (tier === "standard") return 200 * 1024 * 1024;
  return WORKSPACE_MAX_TOTAL_BYTES;
}

/** Entries older than this are purged on read/save. */
export const WORKSPACE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const WORKSPACE_INDEX_KEY = "index";

export const WORKSPACE_BLOB_PREFIX = "blob:";

export const WORKSPACE_RESUMABLE_SLUGS = new Set([
  "merge-pdf",
  "pdf-editor",
  "sign-pdf",
  "universal-converter",
]);
