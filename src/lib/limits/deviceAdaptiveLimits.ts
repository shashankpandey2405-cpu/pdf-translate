import { getDeviceCapability, getDeviceMaxPagesCap, type DeviceTier } from "@/lib/deviceCapability";
import { requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { isPrivacyFirstMode } from "@/lib/trustShield/storage";
import { TRUST_SHIELD_BULK_MAX_FILES } from "@/lib/trustShield/constants";

import { PRICING } from "@/lib/pricing/plans";

/** Signed-in free monthly cloud + AI credits (replaces legacy 2 jobs/day trial). */
export const FREE_MONTHLY_CREDITS = PRICING.free.aiCreditsPerMonth;
/** @deprecated Use FREE_MONTHLY_CREDITS — kept for import compatibility */
export const CLOUD_DAILY_JOBS_DEFAULT = FREE_MONTHLY_CREDITS;
export const CLOUD_MAX_FILE_MB = 15;
export const CLOUD_MAX_PAGES = 10;
export const CLOUD_OCR_MAX_PAGES = 20;

export type DeviceBrowserLimits = {
  tier: DeviceTier;
  maxFileMB: number;
  maxPages: number;
  maxMergeFiles: number;
};

/** Browser caps tuned to device RAM/CPU — avoids tab crashes on phones. */
export function getDeviceBrowserLimits(): DeviceBrowserLimits {
  const { tier } = getDeviceCapability();
  if (tier === "low") {
    return { tier, maxFileMB: 12, maxPages: 40, maxMergeFiles: 8 };
  }
  if (tier === "high") {
    return { tier, maxFileMB: 80, maxPages: getDeviceMaxPagesCap(200), maxMergeFiles: 100 };
  }
  return { tier, maxFileMB: 35, maxPages: getDeviceMaxPagesCap(100), maxMergeFiles: 40 };
}

export type BrowserWorkloadInput = {
  slug?: string;
  fileCount: number;
  largestFileMB: number;
  pageCount?: number | null;
  isSignedIn: boolean;
};

export type BrowserWorkloadResult = {
  allowed: boolean;
  tooHeavyForDevice: boolean;
  suggestCloud: boolean;
  suggestSignIn: boolean;
  message?: string;
  deviceLimits: DeviceBrowserLimits;
};

/**
 * Guest + signed-in browser processing: allow freely within device caps;
 * above that steer to Trusted Cloud (sign-in) instead of crashing.
 */
export function assessBrowserWorkload(input: BrowserWorkloadInput): BrowserWorkloadResult {
  const device = getDeviceBrowserLimits();
  const { slug, fileCount, largestFileMB, pageCount, isSignedIn } = input;

  if (slug && requiresCloudOnlyProcessing(slug)) {
    return {
      allowed: false,
      tooHeavyForDevice: true,
      suggestCloud: true,
      suggestSignIn: !isSignedIn,
      message: SIGN_IN_REASON.ocr,
      deviceLimits: device,
    };
  }

  const maxFiles = isPrivacyFirstMode() ? TRUST_SHIELD_BULK_MAX_FILES : device.maxMergeFiles;

  if (fileCount > maxFiles) {
    const privacy = isPrivacyFirstMode();
    return {
      allowed: false,
      tooHeavyForDevice: false,
      suggestCloud: !privacy && device.tier === "low",
      suggestSignIn: !privacy && !isSignedIn,
      message: privacy
        ? `Privacy-First merge supports up to ${TRUST_SHIELD_BULK_MAX_FILES} PDFs in your browser.`
        : `This device can comfortably merge about ${device.maxMergeFiles} files at once. Sign in for cloud processing on larger batches.`,
      deviceLimits: device,
    };
  }

  const pages = pageCount != null && Number.isFinite(pageCount) ? pageCount : null;
  const fileTooBig = largestFileMB > device.maxFileMB;
  const pagesTooMany = pages != null && pages > device.maxPages;

  if (fileTooBig || pagesTooMany) {
    return {
      allowed: false,
      tooHeavyForDevice: true,
      suggestCloud: true,
      suggestSignIn: !isSignedIn,
      message: fileTooBig
        ? "This file is heavy for browser processing on your device. Use Trusted Cloud for better results."
        : "This document has many pages — Trusted Cloud handles it more reliably.",
      deviceLimits: device,
    };
  }

  if (device.tier === "low" && fileCount > 5 && largestFileMB > 8) {
    return {
      allowed: false,
      tooHeavyForDevice: true,
      suggestCloud: true,
      suggestSignIn: !isSignedIn,
      message:
        "Multiple large files may freeze older phones. Sign in for free Trusted Cloud processing, or try fewer/smaller files in the browser.",
      deviceLimits: device,
    };
  }

  return {
    allowed: true,
    tooHeavyForDevice: false,
    suggestCloud: false,
    suggestSignIn: false,
    deviceLimits: device,
  };
}
