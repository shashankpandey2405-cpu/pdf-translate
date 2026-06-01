/** Standard SEO title suffix — trust-focused, AdSense-safe. */
export const SEO_TITLE_TRUST = "Secure Online PDF Tools";

/**
 * Build a consistent tool meta title: "Tool Name | Secure Online PDF Tools | PDFTrusted"
 */
export function formatToolSeoTitle(displayName: string, bundleTitle?: string): string {
  const cleaned = bundleTitle?.replace(/\s*\|\s*(PDFTrusted|Secure Online PDF Tools|Faster than Adobe).*$/i, "").trim();
  const label =
    displayName.split("—")[0]?.split("|")[0]?.trim() ||
    cleaned?.split("|")[0]?.split("—")[0]?.trim() ||
    displayName.trim();
  if (cleaned && /\|\s*PDFTrusted\s*$/i.test(cleaned) && /Secure Online PDF Tools/i.test(cleaned)) {
    return cleaned;
  }
  return `${label} | ${SEO_TITLE_TRUST} | PDFTrusted`;
}
