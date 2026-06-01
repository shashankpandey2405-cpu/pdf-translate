import { TOOL_SEO_BUNDLES, getToolSeoBundle, type ToolRichSeo } from "@/data/seo/toolSeoBundles";
import { getToolHref } from "../../../constants/tools";

/** Tool slugs with dedicated guide + FAQ pages (canonical bundle keys only). */
export const GUIDE_TOOL_SLUGS: string[] = Object.keys(TOOL_SEO_BUNDLES).filter(
  (key) => typeof TOOL_SEO_BUNDLES[key] === "object",
);

export const PILOT_GUIDE_SLUGS = [
  "merge-pdf",
  "compress-pdf",
  "pdf-to-word",
  "ocr-pdf",
  "translate-pdf",
] as const;

export type HelpLinkSet = {
  guideHref: string;
  faqHref: string;
  toolHref: string;
  learnHref?: string;
};

export function guidePathForSlug(slug: string): string {
  return `/guides/${slug.replace(/^\/+/, "")}`;
}

export function faqPathForSlug(slug: string): string {
  return `/faq/${slug.replace(/^\/+/, "")}`;
}

export function getHelpLinksForTool(slug: string): HelpLinkSet {
  const normalized = slug.replace(/^\/+/, "");
  return {
    guideHref: guidePathForSlug(normalized),
    faqHref: faqPathForSlug(normalized),
    toolHref: getToolHref({ slug: normalized, routePath: normalized.startsWith("tools/") ? `/${normalized}` : undefined }),
    learnHref: "/help",
  };
}

export function getGuideBundle(slug: string): ToolRichSeo | undefined {
  return getToolSeoBundle(slug.replace(/^\/+/, ""));
}

export function toolDisplayNameFromBundle(slug: string, bundle?: ToolRichSeo): string {
  const title = bundle?.title ?? slug.replace(/-/g, " ");
  return title.split("|")[0]?.trim() || title;
}

export const HELP_TOPICS = [
  { slug: "getting-started", title: "Getting started", href: "/help/getting-started" },
  { slug: "troubleshooting", title: "Troubleshooting", href: "/help/troubleshooting" },
  { slug: "billing", title: "Billing & credits", href: "/help/billing" },
  { slug: "privacy", title: "Privacy & data", href: "/help/privacy" },
] as const;

export const LEARN_TOPICS = [
  { slug: "about-pdftrusted", title: "About PDFTrusted", href: "/learn/about-pdftrusted" },
  { slug: "security", title: "Security", href: "/learn/security" },
  { slug: "privacy", title: "Privacy", href: "/learn/privacy" },
  { slug: "browser-processing", title: "Browser processing", href: "/learn/browser-processing" },
  { slug: "cloud-processing", title: "Cloud processing", href: "/learn/cloud-processing" },
  { slug: "ai-features", title: "AI features", href: "/learn/ai-features" },
  { slug: "ocr-technology", title: "OCR technology", href: "/learn/ocr-technology" },
  { slug: "translation-technology", title: "Translation technology", href: "/learn/translation-technology" },
] as const;

export type LearnTopicSlug = (typeof LEARN_TOPICS)[number]["slug"];
