import { isIOS, isMobileSafari } from "@/lib/download/isIOS";
import { getDeviceCapability } from "@/lib/deviceCapability";

/**
 * Safari-aware canvas DPR cap — prevents Retina 3× OOM on iPhone.
 * Phase 2: mobile stability.
 */
export function getRenderDprCap(explicitCap?: number): number {
  if (explicitCap != null && explicitCap > 0) {
    return Math.min(explicitCap, getDefaultCap());
  }
  return getDefaultCap();
}

function getDefaultCap(): number {
  const tier = getDeviceCapability().tier;
  if (isMobileSafari()) {
    return tier === "low" ? 1.25 : 1.5;
  }
  if (isIOS()) {
    return tier === "low" ? 1.5 : 2;
  }
  if (tier === "low") return 1.5;
  if (tier === "standard") return 2;
  return 3;
}

/** Max simultaneous live PDF canvases (editor + previews). */
export function getMaxLiveCanvasCount(): number {
  const tier = getDeviceCapability().tier;
  if (isMobileSafari() || tier === "low") return 2;
  if (tier === "standard") return 3;
  return 4;
}

/** Cap stacked preview pages to avoid data-URL memory spikes on mobile. */
export function getMaxStackPreviewPages(): number {
  const tier = getDeviceCapability().tier;
  if (isMobileSafari() || tier === "low") return 12;
  if (tier === "standard") return 24;
  return 48;
}

/** Editor sidebar: only render thumbnails within ±radius of current page. */
export function getEditorThumbWindowRadius(): number {
  const tier = getDeviceCapability().tier;
  if (isMobileSafari() || tier === "low") return 1;
  if (tier === "standard") return 2;
  return 3;
}
