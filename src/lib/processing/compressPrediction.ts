/**
 * Browser compress shrink prediction — honest pre-flight for hybrid routing.
 * Phase 6: compression quality messaging.
 */
import type { DocumentAnalysis } from "@/lib/processing/documentAnalysis";

export type CompressPrediction = {
  /** Estimated browser shrink 5–15% for metadata-only path */
  browserShrinkPercentMin: number;
  browserShrinkPercentMax: number;
  recommendCloud: boolean;
  reason: string;
};

export function predictBrowserCompressOutcome(
  file: File,
  analysis?: DocumentAnalysis | null,
): CompressPrediction {
  const mb = file.size / (1024 * 1024);
  const imageHeavy = analysis?.imageHeavy ?? (mb > 5 && !analysis?.textLayerRich);
  const scanned = analysis?.likelyScanned ?? false;

  if (imageHeavy || scanned || mb > 12) {
    return {
      browserShrinkPercentMin: 3,
      browserShrinkPercentMax: 12,
      recommendCloud: true,
      reason:
        "Image-heavy or large PDF — Turbo Cloud (Ghostscript) typically achieves much stronger compression than browser metadata cleanup.",
    };
  }

  return {
    browserShrinkPercentMin: 5,
    browserShrinkPercentMax: 15,
    recommendCloud: false,
    reason:
      "Digital text PDF — browser mode may trim metadata and optimize structure. For maximum shrink, use Turbo Cloud.",
  };
}
