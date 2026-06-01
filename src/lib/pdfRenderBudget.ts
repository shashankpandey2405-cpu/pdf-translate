import { getRecommendedPdfScaleCap } from "@/lib/deviceCapability";

/**
 * Caps pdf.js viewport scale so mobile/low-memory devices stay responsive.
 */
export function getPdfViewportMaxScale(): number {
  if (typeof window === "undefined") return 1.8;
  return getRecommendedPdfScaleCap();
}
