/** Mobile preview policy — inline previews off except AI scanner / smart scan (modal only). */

export const AI_MOBILE_PREVIEW_SLUGS = new Set([
  "smart-scan-ai",
  "tools/ai-scanner",
  "ai-scanner",
  "chat-pdf",
]);

export function isAiMobilePreviewTool(slug?: string): boolean {
  if (!slug) return false;
  return AI_MOBILE_PREVIEW_SLUGS.has(slug);
}

/** Inline PDF/image preview in the main workspace (desktop only by default). */
export function allowsInlineMobilePreview(opts?: { toolSlug?: string; force?: boolean }): boolean {
  if (opts?.force) return true;
  return false;
}

/** User-triggered preview modal (AI document tools only). */
export function allowsModalMobilePreview(toolSlug?: string): boolean {
  return isAiMobilePreviewTool(toolSlug);
}
