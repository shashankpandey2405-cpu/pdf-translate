import type { AccessTier } from "@/context/PremiumContext";
import { getDeviceBrowserLimits } from "@/lib/limits/deviceAdaptiveLimits";

/** Tools that run fully in the browser — never apply cloud upload caps. */
export const LOCAL_BROWSER_TOOL_SLUGS = new Set([
  "pdf-editor",
  "sign-pdf",
  "merge-pdf",
  "split-pdf",
  "rotate-pdf",
  "remove-pages",
  "extract-pages",
  "organize-pdf",
  "page-numbers",
  "watermark-pdf",
  "jpg-to-pdf",
  "png-to-pdf",
  "photo-resizer",
]);

const EDITOR_SLUGS = new Set(["pdf-editor", "sign-pdf"]);

type LocalLimits = { maxFileMB: number; maxPages: number };

function tierEditorLimits(tier: AccessTier): LocalLimits {
  if (tier === "premium") return { maxFileMB: 100, maxPages: 200 };
  if (tier === "signed_in") return { maxFileMB: 45, maxPages: 150 };
  return { maxFileMB: 30, maxPages: 100 };
}

export function isLocalBrowserTool(slug?: string): boolean {
  return Boolean(slug && LOCAL_BROWSER_TOOL_SLUGS.has(slug));
}

/**
 * Upload gate for in-browser tools (PDF Editor, Sign PDF, etc.).
 * Uses tier + device caps — not cloud staging limits.
 */
export function assessLocalBrowserTool(
  tier: AccessTier,
  slug: string,
  fileSizeMB: number,
  pageCount?: number | null,
): { allowed: boolean; reason?: string } {
  if (!isLocalBrowserTool(slug)) {
    return { allowed: true };
  }

  const device = getDeviceBrowserLimits();
  const tierLimits = EDITOR_SLUGS.has(slug) ? tierEditorLimits(tier) : tierEditorLimits(tier);

  const maxFileMB = EDITOR_SLUGS.has(slug)
    ? Math.max(tierLimits.maxFileMB, device.maxFileMB)
    : Math.min(tierLimits.maxFileMB, device.maxFileMB);
  const maxPages = Math.max(tierLimits.maxPages, device.maxPages);

  if (fileSizeMB > maxFileMB) {
    return {
      allowed: false,
      reason: `This file is too large for browser editing on your device (max ~${Math.round(maxFileMB)} MB). Try compressing the PDF first.`,
    };
  }

  if (pageCount != null && Number.isFinite(pageCount) && pageCount > maxPages) {
    return {
      allowed: false,
      reason: `This document has too many pages for browser mode (max ~${maxPages} pages). Split the PDF or use advanced processing.`,
    };
  }

  return { allowed: true };
}
