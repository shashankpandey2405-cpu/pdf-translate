import { isHomePath, isToolWorkflowPath, primaryRouteSegment } from "@/lib/siteRoutes";

/** Auth, account, and internal surfaces — no third-party ads. */
const AD_FREE_SEGMENTS = new Set([
  "login",
  "account",
  "reset-password",
  "recent",
  "get-app",
]);

const AD_FREE_SUBSTRINGS = ["/internal", "internal-tool-suite", "/pdf-editor", "/sign-pdf"];

/** Editorial pages (reserved if display ads are re-enabled later). */
const EDITORIAL_SEGMENTS = new Set([
  "about-us",
  "contact",
  "faq",
  "how-to-use",
  "all-tools",
  "compare",
  "disclaimer",
  "security",
  "privacy-center",
  "privacy-policy",
  "terms-of-service",
  "pricing",
  "refund-policy",
  "cookie-policy",
]);

export function isAdFreePath(pathname: string): boolean {
  if (AD_FREE_SUBSTRINGS.some((s) => pathname.includes(s))) return true;
  return AD_FREE_SEGMENTS.has(primaryRouteSegment(pathname));
}

/** Google AdSense display slots (disabled in code until explicitly enabled). */
export function isDisplayAdPath(pathname: string): boolean {
  if (isAdFreePath(pathname)) return false;
  return true;
}

export function isHeaderBannerPath(pathname: string): boolean {
  if (isAdFreePath(pathname)) return false;
  if (isHomePath(pathname)) return false;
  if (isToolWorkflowPath(pathname)) return false;
  if (AD_FREE_SUBSTRINGS.some((s) => pathname.includes(s))) return false;
  return EDITORIAL_SEGMENTS.has(primaryRouteSegment(pathname));
}
