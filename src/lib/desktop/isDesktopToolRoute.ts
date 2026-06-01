const NON_TOOL_SEGMENTS = new Set([
  "",
  "pricing",
  "refund-policy",
  "privacy-policy",
  "terms-of-service",
  "about-us",
  "contact-us",
  "download",
  "get-app",
  "login",
  "account",
  "recent-activity",
  "reset-password",
  "cookie-policy",
  "disclaimer",
  "faq",
  "how-to-use",
  "security",
  "privacy-center",
  "compare",
  "all-tools",
  "internal-tool-suite",
  "internal",
]);

const FULLSCREEN_TOOL_SEGMENTS = new Set(["pdf-editor", "sign-pdf"]);

/** Desktop master workspace applies to tool routes only (lg+). */
export function isDesktopToolRoute(pathname: string): boolean {
  const clean = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "").replace(/^\//, "");
  const first = clean.split("/").filter(Boolean)[0] ?? "";

  if (FULLSCREEN_TOOL_SEGMENTS.has(first)) return false;
  if (NON_TOOL_SEGMENTS.has(first)) return false;
  if (clean.startsWith("internal/") || clean.startsWith("compare/")) return false;

  return Boolean(first);
}
