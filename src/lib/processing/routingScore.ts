/**
 * Unified hybrid routing scorer — fuses device workload, document analysis, and tool rules.
 * Phase 3: Smart Hybrid Routing Engine.
 */
import { isMobileSafari } from "@/lib/download/isIOS";
import { assessBrowserWorkload } from "@/lib/limits/deviceAdaptiveLimits";
import { suggestProcessingMode } from "@/lib/limits/suggestProcessingMode";
import type { DocumentAnalysis } from "@/lib/processing/documentAnalysis";
import { PLATFORM } from "@/lib/processing/documentScale";
import {
  requiresCloudOnlyProcessing,
} from "@/lib/processing/toolProfiles";
import { canSuggestCloudForTool } from "@/lib/processing/cloudCapabilities";

export type RoutingRecommendation = "browser" | "enhanced";
export type RoutingConfidence = "high" | "medium" | "low";

export type RoutingScore = {
  recommended: RoutingRecommendation;
  confidence: RoutingConfidence;
  blockBrowser: boolean;
  suggestCloud: boolean;
  reasonKey: string;
  reasonDefault: string;
  signals: string[];
};

function deviceMemoryGb(): number | null {
  if (typeof navigator === "undefined") return null;
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof dm === "number" && dm > 0 ? dm : null;
}

/** Tool-specific cloud defaults from audit Phase 3. */
function toolCloudBias(slug: string, analysis?: DocumentAnalysis | null): {
  bias: RoutingRecommendation;
  blockBrowser?: boolean;
  reasonKey?: string;
  reasonDefault?: string;
} | null {
  if (requiresCloudOnlyProcessing(slug)) {
    return {
      bias: "enhanced",
      blockBrowser: true,
      reasonKey: "execution.suggestCloudOnly",
      reasonDefault: "This tool uses Turbo Cloud for best results — sign in to continue.",
    };
  }

  if (slug === "compress-pdf" && analysis?.imageHeavy && canSuggestCloudForTool(slug)) {
    return {
      bias: "enhanced",
      reasonKey: "execution.suggestHeavy",
      reasonDefault:
        "Image-heavy PDF — Turbo Cloud delivers stronger compression than browser metadata cleanup.",
    };
  }

  if ((slug === "redact-pdf" || slug === "protect-pdf") && canSuggestCloudForTool(slug)) {
    return {
      bias: "enhanced",
      reasonKey: "execution.suggestHeavy",
      reasonDefault:
        "For standard PDF compatibility and true redaction, Turbo Cloud is recommended.",
    };
  }

  if (slug === "merge-pdf" && analysis && analysis.pageCount > PLATFORM.maxPagesBrowser) {
    return {
      bias: "browser",
      reasonKey: "execution.mergeBrowserBatch",
      reasonDefault:
        "Very large merge — try fewer files per batch. Merge runs privately in your browser (no cloud worker yet).",
    };
  }

  if (
    (slug === "pdf-to-word" || slug === "pdf-to-excel") &&
    analysis?.likelyScanned &&
    canSuggestCloudForTool(slug)
  ) {
    return {
      bias: "enhanced",
      blockBrowser: true,
      reasonKey: "execution.scannedNeedsCloud",
      reasonDefault:
        "Scanned PDF detected — browser export cannot preserve layout. Turbo Cloud is required for quality results.",
    };
  }

  return null;
}

/**
 * Score routing after upload (and optionally after document analysis completes).
 */
export function scoreProcessingRoute(input: {
  slug: string;
  file: File;
  pageCount?: number | null;
  isSignedIn?: boolean;
  analysis?: DocumentAnalysis | null;
}): RoutingScore {
  const { slug, file, pageCount, isSignedIn = false, analysis } = input;
  const signals: string[] = [];
  const mb = file.size / (1024 * 1024);

  const toolBias = toolCloudBias(slug, analysis);
  if (toolBias?.blockBrowser) {
    return {
      recommended: "enhanced",
      confidence: "high",
      blockBrowser: true,
      suggestCloud: true,
      reasonKey: toolBias.reasonKey ?? "execution.suggestCloudOnly",
      reasonDefault: toolBias.reasonDefault ?? "Turbo Cloud required for this tool.",
      signals: ["tool_cloud_only_or_bias"],
    };
  }

  const base = suggestProcessingMode({ slug, file, pageCount, isSignedIn });

  let recommended: RoutingRecommendation = base.recommended;
  let blockBrowser = false;
  let confidence: RoutingConfidence = "medium";

  const workload = assessBrowserWorkload({
    slug,
    fileCount: 1,
    largestFileMB: mb,
    pageCount,
    isSignedIn,
  });

  if (!workload.allowed) {
    recommended = "enhanced";
    blockBrowser = true;
    confidence = "high";
    signals.push("workload_blocked");
  }

  if (analysis?.recommendCloud && canSuggestCloudForTool(slug)) {
    recommended = "enhanced";
    confidence = "high";
    signals.push("analysis_recommend_cloud");
    if (analysis.likelyScanned && (slug === "pdf-to-word" || slug === "pdf-to-excel")) {
      blockBrowser = true;
      signals.push("scanned_conversion_block");
    }
  } else if (analysis?.likelyScanned && (slug === "pdf-to-word" || slug === "pdf-to-excel")) {
    blockBrowser = canSuggestCloudForTool(slug);
    signals.push("scanned_conversion_block");
  }

  if (analysis?.imageHeavy && slug === "compress-pdf" && canSuggestCloudForTool(slug)) {
    recommended = "enhanced";
    confidence = "high";
    signals.push("compress_image_heavy");
  }

  const mem = deviceMemoryGb();
  if (mem !== null && mem <= 4 && mb > 8 && canSuggestCloudForTool(slug)) {
    recommended = "enhanced";
    confidence = "high";
    signals.push("low_device_memory");
  }

  if (isMobileSafari() && mb > 10 && canSuggestCloudForTool(slug)) {
    recommended = "enhanced";
    confidence = "high";
    signals.push("mobile_safari_large_file");
  }

  if (
    toolBias &&
    toolBias.bias === "enhanced" &&
    recommended === "browser" &&
    canSuggestCloudForTool(slug)
  ) {
    recommended = "enhanced";
    signals.push("tool_bias_cloud");
  }

  const cloudActionable = canSuggestCloudForTool(slug);
  const suggestCloud =
    cloudActionable && (recommended === "enhanced" || base.suggestCloud);

  if (recommended === "enhanced" && !cloudActionable) {
    recommended = "browser";
    blockBrowser = false;
    signals.push("cloud_unavailable_fallback_browser");
  }

  const reasonKey =
    toolBias?.reasonKey ??
    (analysis?.recommendCloud && cloudActionable ? "execution.suggestHeavy" : base.reasonKey);
  const reasonDefault =
    toolBias?.reasonDefault ??
    analysis?.reason ??
    base.reasonDefault;

  return {
    recommended,
    confidence,
    blockBrowser,
    suggestCloud,
    reasonKey,
    reasonDefault,
    signals,
  };
}
