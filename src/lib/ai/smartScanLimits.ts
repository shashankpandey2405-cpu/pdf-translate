/** Smart Scan AI page caps — keep in sync with server/ai/processor.ts */
export const SMART_SCAN_FREE_MAX_PAGES = 2;
export const SMART_SCAN_PREMIUM_MAX_PAGES = 5;

export function smartScanMaxPages(isPremium: boolean): number {
  return isPremium ? SMART_SCAN_PREMIUM_MAX_PAGES : SMART_SCAN_FREE_MAX_PAGES;
}

export const SMART_SCAN_SEO_ALIASES = [
  "ai-document-scanner",
  "photo-to-editable-pdf",
  "scan-to-editable-pdf",
  "image-to-editable-pdf",
] as const;

export type SmartScanSeoAlias = (typeof SMART_SCAN_SEO_ALIASES)[number];

export function isSmartScanSeoAlias(path: string): path is SmartScanSeoAlias {
  return (SMART_SCAN_SEO_ALIASES as readonly string[]).includes(path.replace(/^\/+/, ""));
}
