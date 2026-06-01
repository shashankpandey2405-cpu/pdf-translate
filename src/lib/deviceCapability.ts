/**
 * Non-invasive device capability hints for adaptive PDF performance.
 * Uses only standard browser APIs — no fingerprinting.
 */

export type DeviceTier = "low" | "standard" | "high";

export type DeviceCapabilitySnapshot = {
  tier: DeviceTier;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number;
  isCoarsePointer: boolean;
  isNarrowViewport: boolean;
};

let cached: DeviceCapabilitySnapshot | null = null;

function readDeviceMemoryGb(): number | null {
  if (typeof navigator === "undefined") return null;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof mem === "number" && mem > 0 ? mem : null;
}

export function getDeviceCapability(): DeviceCapabilitySnapshot {
  if (cached) return cached;

  if (typeof window === "undefined") {
    cached = {
      tier: "standard",
      deviceMemoryGb: null,
      hardwareConcurrency: 4,
      isCoarsePointer: false,
      isNarrowViewport: false,
    };
    return cached;
  }

  const deviceMemoryGb = readDeviceMemoryGb();
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 4;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const isNarrowViewport = window.innerWidth < 768;

  let tier: DeviceTier = "standard";
  if (
    (deviceMemoryGb !== null && deviceMemoryGb <= 4) ||
    hardwareConcurrency <= 4 ||
    (isCoarsePointer && isNarrowViewport)
  ) {
    tier = "low";
  } else if (
    (deviceMemoryGb !== null && deviceMemoryGb >= 8) &&
    hardwareConcurrency >= 8 &&
    !isNarrowViewport
  ) {
    tier = "high";
  }

  cached = {
    tier,
    deviceMemoryGb,
    hardwareConcurrency,
    isCoarsePointer,
    isNarrowViewport,
  };
  return cached;
}

export function getMaxConcurrentThumbs(): number {
  const { tier } = getDeviceCapability();
  if (tier === "low") return 2;
  if (tier === "high") return 8;
  return 4;
}

/** Scale guest/signed file caps down on low-tier devices (0.65 = keep 65% of limit). */
export function getDeviceFileLimitMultiplier(): number {
  const { tier } = getDeviceCapability();
  if (tier === "low") return 0.65;
  if (tier === "high") return 1;
  return 0.85;
}

export function getDeviceMaxFilesAdjustment(): number {
  const { tier } = getDeviceCapability();
  if (tier === "low") return -1;
  return 0;
}

/** @deprecated Use assessBrowserWorkload() — avoids hard blocks; steers to cloud instead. */
export function shouldLimitBatchMerge(_fileCount: number): boolean {
  return false;
}

export function resetDeviceCapabilityCache(): void {
  cached = null;
}

/** Caps pdf.js viewport scale for editor/viewer. */
export function getRecommendedPdfScaleCap(): number {
  const { tier, isCoarsePointer, isNarrowViewport } = getDeviceCapability();

  if (isNarrowViewport || isCoarsePointer) {
    if (tier === "low") return 1.1;
    return 1.25;
  }

  if (tier === "low") return 1.5;
  if (tier === "high") return 2.75;
  return 2.1;
}

export function getDeviceMaxPagesCap(fallback: number): number {
  const { tier } = getDeviceCapability();
  if (tier === "low") return Math.min(fallback, Math.round(fallback * 0.7));
  return fallback;
}
