/**
 * Homepage CTAs must target routes registered in src/App.tsx Switch.
 * Used for documentation and optional runtime checks in dev.
 */
export const HOMEPAGE_CTA_ROUTES = [
  "/",
  "/all-tools",
  "/pricing",
  "/account",
  "/login",
  "/compare",
  "/faq",
  "/contact",
  "/privacy-center",
  "/security",
  "/compress-pdf",
  "/merge-pdf",
  "/pdf-editor",
  "/ai-summarize",
  "/chat-pdf",
  "/translate-pdf",
  "/ocr-pdf",
  "/sign-pdf",
  "/document-scanner",
] as const;

export type HomepageCtaRoute = (typeof HOMEPAGE_CTA_ROUTES)[number];
