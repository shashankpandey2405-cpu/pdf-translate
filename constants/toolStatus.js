import { TOOL_SLUGS } from "./tools.js";

/**
 * Hero tools — primary nav, home bento, and sitemap emphasis (~15).
 * Other live tools remain reachable via /all-tools and direct URLs.
 */
export const HERO_TOOL_SLUGS = [
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
  "ocr-pdf",
  "pdf-to-word",
  "pdf-editor",
  "unlock-pdf",
  "sign-pdf",
  "protect-pdf",
  "pdf-to-image",
  "word-to-pdf",
  "universal-converter",
  "document-scanner",
  "rotate-pdf",
  "redact-pdf",
];

const HERO_SET = new Set(HERO_TOOL_SLUGS);

/** @deprecated All catalog tools are live; kept for API compatibility. */
export const COMING_SOON_TOOL_SLUGS = [];

/** @type {Record<string, "live" | "coming-soon">} */
export const TOOL_IMPLEMENTATION_STATUS = Object.fromEntries(
  TOOL_SLUGS.map((slug) => [slug, "live"]),
);

/**
 * @param {string} slug
 * @returns {"live" | "coming-soon"}
 */
export function getToolImplementationStatus(slug) {
  if (slug in TOOL_IMPLEMENTATION_STATUS) return TOOL_IMPLEMENTATION_STATUS[slug];
  return "live";
}

/** @param {string} slug */
export function isToolLive(slug) {
  return getToolImplementationStatus(slug) === "live";
}

/**
 * Filter tool group listings to live tools only (nav, all-tools, footer, command palette).
 * @param {Array<{ category?: string; categoryKey?: string; items: Array<{ slug: string }> }>} groups
 */
export function filterLiveToolGroups(groups) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isToolLive(item.slug)),
    }))
    .filter((group) => group.items.length > 0);
}

/** @param {string} slug */
export function isHeroTool(slug) {
  return HERO_SET.has(slug);
}

/**
 * Nav + sitemap emphasis: hero live tools only.
 * @param {Array<{ category?: string; categoryKey?: string; items: Array<{ slug: string }> }>} groups
 */
export function filterHeroToolGroups(groups) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isToolLive(item.slug) && isHeroTool(item.slug)),
    }))
    .filter((group) => group.items.length > 0);
}
