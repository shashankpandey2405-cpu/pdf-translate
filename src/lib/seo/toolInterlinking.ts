import { TOOL_GROUPS_BY_SLUG } from "../../../constants/tools";
import { getPreferredLocaleToolSlug } from "@/lib/seo/localeSlugAliases";
import type { LocaleCode } from "@/lib/seo/site";
import { isLocaleCode } from "@/lib/seo/site";

/** High-intent cross-links (canonical slugs). */
const SEMANTIC_NEIGHBORS: Record<string, string[]> = {
  "merge-pdf": ["compress-pdf", "split-pdf", "ocr-pdf", "chat-pdf"],
  "compress-pdf": ["merge-pdf", "pdf-to-word", "pdf-to-image", "split-pdf"],
  "split-pdf": ["merge-pdf", "rotate-pdf", "compress-pdf", "page-numbers"],
  "pdf-to-word": ["word-to-pdf", "ocr-pdf", "pdf-editor", "compress-pdf"],
  "word-to-pdf": ["pdf-to-word", "merge-pdf", "compress-pdf", "pdf-editor"],
  "pdf-editor": ["sign-pdf", "merge-pdf", "compress-pdf", "ocr-pdf"],
  "sign-pdf": ["pdf-editor", "hard-lock-pdf", "protect-pdf", "merge-pdf"],
  "ocr-pdf": ["pdf-to-word", "pdf-editor", "translate-pdf", "compress-pdf"],
  "unlock-pdf": ["protect-pdf", "repair-pdf", "pdf-editor", "compress-pdf"],
  "protect-pdf": ["unlock-pdf", "hard-lock-pdf", "sign-pdf", "redact-pdf"],
  "pdf-to-image": ["compress-pdf", "jpg-to-pdf", "merge-pdf", "pdf-to-word"],
  "watermark-pdf": ["pdf-editor", "remove-watermark", "compress-pdf", "merge-pdf"],
  "rotate-pdf": ["split-pdf", "merge-pdf", "pdf-editor", "page-numbers"],
};

const MAX_LINKS = 8;

function getCategoryPeers(canonicalSlug: string): string[] {
  const entry = TOOL_GROUPS_BY_SLUG[canonicalSlug];
  if (!entry?.categoryKey) return [];
  const peers: string[] = [];
  for (const slug of Object.keys(TOOL_GROUPS_BY_SLUG)) {
    if (slug === canonicalSlug) continue;
    if (TOOL_GROUPS_BY_SLUG[slug]?.categoryKey === entry.categoryKey) {
      peers.push(slug);
    }
  }
  return peers;
}

/** Canonical slugs to surface in “Related tools” (deduped, stable order). */
export function getRelatedToolSlugs(canonicalSlug: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (slug: string) => {
    if (slug === canonicalSlug || seen.has(slug) || !TOOL_GROUPS_BY_SLUG[slug]) return;
    seen.add(slug);
    out.push(slug);
  };

  for (const slug of SEMANTIC_NEIGHBORS[canonicalSlug] ?? []) add(slug);
  for (const slug of getCategoryPeers(canonicalSlug)) add(slug);

  if (out.length < 4) {
    for (const slug of ["merge-pdf", "compress-pdf", "pdf-editor", "sign-pdf", "pdf-to-word"]) {
      add(slug);
      if (out.length >= MAX_LINKS) break;
    }
  }

  return out.slice(0, MAX_LINKS);
}

/** Locale-aware href path (no locale prefix): prefers native SEO alias when defined. */
export function getLocaleToolHrefPath(locale: string, canonicalSlug: string): string {
  const tool = TOOL_GROUPS_BY_SLUG[canonicalSlug];
  if (!tool) return `/${canonicalSlug}`;

  const loc: LocaleCode = isLocaleCode(locale) ? locale : "en";
  const publicSlug = getPreferredLocaleToolSlug(loc, canonicalSlug);
  const base = tool.routePath ?? `/${publicSlug}`;
  if (tool.routePath && publicSlug === canonicalSlug) {
    return base.startsWith("/") ? base : `/${base}`;
  }
  return `/${publicSlug}`;
}

export type RelatedToolLink = {
  canonicalSlug: string;
  href: string;
  labelKey: string;
};

export function buildRelatedToolLinks(locale: string, canonicalSlug: string): RelatedToolLink[] {
  return getRelatedToolSlugs(canonicalSlug).map((canonicalSlug) => ({
    canonicalSlug,
    href: getLocaleToolHrefPath(locale, canonicalSlug),
    labelKey: `tools.${canonicalSlug}.label`,
  }));
}
