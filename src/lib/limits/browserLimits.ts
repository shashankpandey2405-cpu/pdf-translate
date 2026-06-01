import type { AccessTier } from "@/context/PremiumContext";
import { type DeviceTier, getDeviceCapability } from "@/lib/deviceCapability";
import {
  NORMAL_MAX_FILE_MB,
  NORMAL_MAX_PAGES_WORD_OCR,
  PREMIUM_MAX_FILE_MB,
} from "@/lib/processing/toolProfiles";

export { NORMAL_MAX_FILE_MB, NORMAL_MAX_PAGES_WORD_OCR, PREMIUM_MAX_FILE_MB };

function applyDeviceTierToBrowserLimits(base: BrowserLimits, deviceTier: DeviceTier): BrowserLimits {
  if (deviceTier === "high") {
    return { ...base, pdfImageScale: Math.min(base.pdfImageScale, 2) };
  }
  if (deviceTier !== "low") return base;
  return {
    maxFileMB: Math.max(5, Math.round(base.maxFileMB * 0.65)),
    maxPages: Math.max(10, Math.round(base.maxPages * 0.7)),
    maxMergeFiles: Math.max(1, base.maxMergeFiles - 1),
    ocrPages: Math.max(5, Math.round(base.ocrPages * 0.5)),
    concurrentJobs: 1,
    pdfImageScale: Math.min(base.pdfImageScale, 1.25),
  };
}

export type BrowserLimits = {
  maxFileMB: number;
  maxPages: number;
  maxMergeFiles: number;
  ocrPages: number;
  concurrentJobs: number;
  pdfImageScale: number;
};

/** Normal (browser) mode caps — same for guest and signed-in to prevent tab crashes. */
export function getNormalModeLimits(): BrowserLimits {
  return {
    maxFileMB: NORMAL_MAX_FILE_MB,
    maxPages: 80,
    maxMergeFiles: 5,
    ocrPages: NORMAL_MAX_PAGES_WORD_OCR,
    concurrentJobs: 1,
    pdfImageScale: 1.5,
  };
}

const GUEST_BROWSER: BrowserLimits = {
  maxFileMB: NORMAL_MAX_FILE_MB,
  maxPages: 80,
  maxMergeFiles: 5,
  ocrPages: NORMAL_MAX_PAGES_WORD_OCR,
  concurrentJobs: 1,
  pdfImageScale: 1.5,
};

const SIGNED_BROWSER: BrowserLimits = {
  maxFileMB: NORMAL_MAX_FILE_MB,
  maxPages: 80,
  maxMergeFiles: 15,
  ocrPages: NORMAL_MAX_PAGES_WORD_OCR,
  concurrentJobs: 2,
  pdfImageScale: 2.0,
};

const PREMIUM_BROWSER: BrowserLimits = {
  maxFileMB: 500,
  maxPages: 500,
  maxMergeFiles: 100,
  ocrPages: 200,
  concurrentJobs: 4,
  pdfImageScale: 2.5,
};

export function baseBrowserLimitsForTier(tier: AccessTier): BrowserLimits {
  if (tier === "premium") return { ...PREMIUM_BROWSER };
  if (tier === "signed_in") return { ...SIGNED_BROWSER };
  return { ...GUEST_BROWSER };
}

/** Browser-local caps with device-tier adjustments (client only). */
export function getBrowserLimits(tier: AccessTier): BrowserLimits {
  if (typeof window === "undefined") {
    return baseBrowserLimitsForTier(tier);
  }
  const base = baseBrowserLimitsForTier(tier);
  try {
    const { tier: deviceTier } = getDeviceCapability();
    return applyDeviceTierToBrowserLimits(base, deviceTier);
  } catch {
    return base;
  }
}

export function getPdfImageScaleForTier(accessTier: AccessTier): number {
  return getBrowserLimits(accessTier).pdfImageScale;
}

/** UI hint for Premium cloud page caps (signed-in free tier). */
export function getEnhancedToolPageCap(toolSlug: string): number | null {
  const caps: Record<string, number> = {
    "ocr-pdf": 20,
    "compress-pdf": 50,
    "pdf-to-word": 50,
    "pdf-to-excel": 50,
    "pdf-to-image": 50,
    "pdf-to-jpg": 50,
    "pdf-to-png": 50,
    "pdf-to-pptx": 50,
    "pdf-to-pdfa": 100,
    "protect-pdf": 50,
    "unlock-pdf": 50,
    "redact-pdf": 50,
    "word-to-pdf": 50,
    "pptx-to-pdf": 50,
  };
  return caps[toolSlug] ?? null;
}
