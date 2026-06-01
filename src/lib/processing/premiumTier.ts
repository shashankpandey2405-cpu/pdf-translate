import { isHybridTool, requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";

export type PremiumProcessingTier = "standard" | "pro";

/** Tools that offer Standard (no OCR) vs Trusted Pro (OCR) in the post-upload modal. */
const OCR_TIER_TOOLS = new Set(["pdf-to-word", "pdf-to-excel", "ocr-pdf"]);

const AI_DOCUMENT_TOOLS = new Set(["translate-pdf", "ai-summarize"]);

export function toolOffersOcrTierChoice(toolSlug: string): boolean {
  return OCR_TIER_TOOLS.has(toolSlug);
}

export function toolOffersAiDocumentModes(toolSlug: string): boolean {
  return AI_DOCUMENT_TOOLS.has(toolSlug);
}

export function toolShowsPremiumChoiceModal(toolSlug: string): boolean {
  return isHybridTool(toolSlug) || requiresCloudOnlyProcessing(toolSlug) || toolOffersOcrTierChoice(toolSlug);
}
