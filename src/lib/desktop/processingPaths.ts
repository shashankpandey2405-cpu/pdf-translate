import { toolOffersOcrTierChoice, toolOffersAiDocumentModes } from "@/lib/processing/premiumTier";
import { isHybridTool, requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";

export type ProcessingPathId = "browser" | "cloud" | "cloud-ocr";

export type ProcessingPathOption = {
  id: ProcessingPathId;
  tier: PremiumProcessingTier;
  mode: "browser" | "enhanced";
};

export function toolSupportsBrowserPath(toolSlug: string, browserDisabledReason?: string | null): boolean {
  if (requiresCloudOnlyProcessing(toolSlug)) return false;
  return !browserDisabledReason;
}

export function toolShowsOcrPaths(toolSlug: string): boolean {
  return toolOffersOcrTierChoice(toolSlug) || toolSlug === "compress-pdf";
}

export function getDefaultProcessingPaths(
  toolSlug: string,
  opts?: { browserDisabledReason?: string | null },
): ProcessingPathOption[] {
  const paths: ProcessingPathOption[] = [];
  const cloudOnly = requiresCloudOnlyProcessing(toolSlug) && isHybridTool(toolSlug) === false;

  if (toolSupportsBrowserPath(toolSlug, opts?.browserDisabledReason) && !cloudOnly) {
    paths.push({ id: "browser", tier: "standard", mode: "browser" });
  }

  if (toolShowsOcrPaths(toolSlug)) {
    paths.push({ id: "cloud", tier: "standard", mode: "enhanced" });
    paths.push({ id: "cloud-ocr", tier: "pro", mode: "enhanced" });
  } else if (isHybridTool(toolSlug) || requiresCloudOnlyProcessing(toolSlug) || toolOffersAiDocumentModes(toolSlug)) {
    paths.push({ id: "cloud", tier: "standard", mode: "enhanced" });
  }

  if (paths.length === 0) {
    paths.push({ id: "browser", tier: "standard", mode: "browser" });
  }

  return paths;
}

export function pathRequiresSignIn(path: ProcessingPathId): boolean {
  return path === "cloud" || path === "cloud-ocr";
}
