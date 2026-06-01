import { SITE_URL } from "@/lib/seo/site";

/** UI nav/footer mark — small PNG generated at build (`scripts/make-icons.mjs`). */
export const BRAND_LOGO_NAV_PATH = "/logo-96.png";

/** Legacy path; build overwrites with 192×192 max. Prefer `BRAND_LOGO_NAV_PATH` in UI. */
export const BRAND_LOGO_PATH = "/logo.png";

/** Rich-result / OG logo — use 512px icon, not nav PNG. */
export const BRAND_LOGO_OG_PATH = "/icon-512.png";

/**
 * Bump when replacing brand assets or forcing PWA / CDN cache refresh.
 */
export const BRAND_ASSET_VERSION = "2026053001";

/** Absolute URL for Open Graph, Twitter cards, JSON-LD `logo`. */
export const BRAND_LOGO_URL = `${SITE_URL}${BRAND_LOGO_OG_PATH}?v=${BRAND_ASSET_VERSION}`;

/** Navbar, footer, splash — always the lightweight nav asset. */
export function brandLogoNavSrc(): string {
  return `${BRAND_LOGO_NAV_PATH}?v=${BRAND_ASSET_VERSION}`;
}

/** @deprecated Prefer `brandLogoNavSrc()` for in-app UI. */
export function brandLogoSrc(): string {
  return brandLogoNavSrc();
}
