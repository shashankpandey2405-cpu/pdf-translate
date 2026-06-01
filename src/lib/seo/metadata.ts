import type { Metadata } from "next";
import { formatToolSeoTitle } from "@/lib/seo/formatToolTitle";
import { LOCALE_ALL_TOOLS_SEO } from "@/data/seo/localeToolSeo/allTools";
import { getLocalizedCompareMeta } from "@/lib/seo/localizedCompareSeo";
import { getLocalizedHomeSeo, getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { getBlogPost } from "@/data/blog/posts";
import { HELP_TOPICS } from "@/data/help/helpCenterRegistry";
import { LEARN_ARTICLES } from "@/data/help/learnArticles";
import type { LearnTopicSlug } from "@/data/help/helpCenterRegistry";
import { getCanonicalSlugFromRoute, getPublicSeoPathSuffix } from "@/lib/seo/seoPath";
import { BRAND_NAME, SITE_URL, SUPPORTED_LOCALES, REGION_HREFLANG_TARGETS, type LocaleCode } from "@/lib/seo/site";
import { withSocialImages } from "@/lib/seo/ogImages";

const NOINDEX_PATHS = new Set(["login", "account", "reset-password", "internal"]);

function localeAlternates(locale: LocaleCode, pathSuffix: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${pathSuffix}`;
  }
  for (const region of REGION_HREFLANG_TARGETS) {
    languages[region] = `${SITE_URL}/en${pathSuffix}`;
  }
  languages["x-default"] = `${SITE_URL}/en${pathSuffix}`;
  return {
    canonical: `${SITE_URL}/${locale}${pathSuffix}`,
    languages,
  };
}

export async function buildPageMetadata(
  locale: LocaleCode,
  pathSegments: string[] | undefined,
): Promise<Metadata> {
  const publicPathSuffix = await getPublicSeoPathSuffix(locale, pathSegments);
  const canonicalSlug = getCanonicalSlugFromRoute(locale, pathSegments);
  const pathSuffix = publicPathSuffix || (pathSegments?.length ? `/${pathSegments.join("/")}` : "");
  const publicSlug = pathSuffix.replace(/^\//, "") || canonicalSlug;
  const slug = canonicalSlug || pathSegments?.join("/") || "";
  const firstSeg = pathSegments?.[0] ?? "";

  const bundle =
    (publicSlug ? getLocalizedToolSeoBundle(locale, publicSlug) : undefined) ??
    (slug ? getLocalizedToolSeoBundle(locale, slug) : undefined) ??
    (firstSeg ? getLocalizedToolSeoBundle(locale, firstSeg) : undefined);

  const noindex = NOINDEX_PATHS.has(firstSeg);

  if (firstSeg === "blog" && pathSegments && pathSegments.length >= 2) {
    const postSlug = pathSegments[1]!;
    const post = getBlogPost(postSlug);
    if (post) {
      const title = `${post.title} | ${BRAND_NAME}`;
      const url = `${SITE_URL}/en/blog/${postSlug}`;
      const enOnlyAlternates: Metadata["alternates"] = {
        canonical: locale === "en" ? url : `${SITE_URL}/${locale}/blog/${postSlug}`,
        languages: { en: url, "x-default": url },
      };
      return {
        title,
        description: post.excerpt,
        alternates: enOnlyAlternates,
        robots: { index: locale === "en", follow: true },
        ...withSocialImages(title, post.excerpt, url),
      };
    }
  }

  if (firstSeg === "compare" && pathSegments && pathSegments.length >= 1) {
    const compareMeta = getLocalizedCompareMeta(locale, pathSegments);
    if (compareMeta) {
      const title = `${compareMeta.title} | ${BRAND_NAME}`;
      const keywords = compareMeta.keywords?.split(",").map((k) => k.trim());
      const url = `${SITE_URL}/${locale}${pathSuffix}`;
      return {
        title,
        description: compareMeta.description,
        ...(keywords?.length ? { keywords } : {}),
        alternates: localeAlternates(locale, pathSuffix),
        robots: { index: true, follow: true },
        ...withSocialImages(title, compareMeta.description, url),
      };
    }
  }

  if (firstSeg === "guides" && pathSegments) {
    if (pathSegments.length === 1) {
      const title = `PDF tool guides | ${BRAND_NAME}`;
      const description = "Step-by-step guides for every PDFTrusted tool — merge, compress, convert, OCR, and AI workflows.";
      const url = `${SITE_URL}/${locale}/guides`;
      return {
        title,
        description,
        alternates: localeAlternates(locale, "/guides"),
        robots: { index: true, follow: true },
        ...withSocialImages(title, description, url),
      };
    }
    const guideSlug = pathSegments.slice(1).join("/");
    const guideBundle = getLocalizedToolSeoBundle(locale, guideSlug);
    if (guideBundle) {
      const toolName = guideBundle.title.split("|")[0]?.trim() || guideSlug;
      const title = `${toolName} — Guide | ${BRAND_NAME}`;
      const url = `${SITE_URL}/${locale}${pathSuffix}`;
      return {
        title,
        description: guideBundle.description,
        alternates: localeAlternates(locale, pathSuffix),
        robots: { index: true, follow: true },
        ...withSocialImages(title, guideBundle.description, url),
      };
    }
  }

  if (firstSeg === "faq" && pathSegments && pathSegments.length >= 2) {
    const faqSlug = pathSegments.slice(1).join("/");
    const faqBundle = getLocalizedToolSeoBundle(locale, faqSlug);
    if (faqBundle) {
      const toolName = faqBundle.title.split("|")[0]?.trim() || faqSlug;
      const title = `${toolName} — FAQ | ${BRAND_NAME}`;
      const description = faqBundle.faqs[0]?.answer ?? faqBundle.description;
      const url = `${SITE_URL}/${locale}${pathSuffix}`;
      return {
        title,
        description,
        alternates: localeAlternates(locale, pathSuffix),
        robots: { index: true, follow: true },
        ...withSocialImages(title, description, url),
      };
    }
  }

  if (firstSeg === "learn" && pathSegments) {
    if (pathSegments.length === 1) {
      const title = `Learn about PDFTrusted | ${BRAND_NAME}`;
      const description = "Security, privacy, browser vs cloud processing, OCR, translation, and AI features explained.";
      const url = `${SITE_URL}/${locale}/learn`;
      return {
        title,
        description,
        alternates: localeAlternates(locale, "/learn"),
        robots: { index: true, follow: true },
        ...withSocialImages(title, description, url),
      };
    }
    const topic = pathSegments[1] as LearnTopicSlug;
    const article = LEARN_ARTICLES[topic];
    if (article) {
      const title = `${article.title} | ${BRAND_NAME}`;
      const url = `${SITE_URL}/${locale}${pathSuffix}`;
      return {
        title,
        description: article.description,
        alternates: localeAlternates(locale, pathSuffix),
        robots: { index: true, follow: true },
        ...withSocialImages(title, article.description, url),
      };
    }
  }

  if (firstSeg === "help" && pathSegments) {
    if (pathSegments.length === 1) {
      const title = `Help Center | ${BRAND_NAME}`;
      const description = "Guides, FAQs, and troubleshooting for PDFTrusted tools, billing, and privacy.";
      const url = `${SITE_URL}/${locale}/help`;
      return {
        title,
        description,
        alternates: localeAlternates(locale, "/help"),
        robots: { index: true, follow: true },
        ...withSocialImages(title, description, url),
      };
    }
    const topicSlug = pathSegments[1] ?? "";
    const topic = HELP_TOPICS.find((t) => t.slug === topicSlug);
    if (topic) {
      const title = `${topic.title} | Help Center | ${BRAND_NAME}`;
      const description = `PDFTrusted help: ${topic.title.toLowerCase()} — guides, limits, and support topics.`;
      const url = `${SITE_URL}/${locale}${pathSuffix}`;
      return {
        title,
        description,
        alternates: localeAlternates(locale, pathSuffix),
        robots: { index: true, follow: true },
        ...withSocialImages(title, description, url),
      };
    }
  }

  if (firstSeg === "account") {
    const title = `My account | ${BRAND_NAME}`;
    const description =
      "Your PDFTrusted profile, plan, AI credits, and usage history.";
    const url = `${SITE_URL}/${locale}/account`;
    return {
      title,
      description,
      alternates: localeAlternates(locale, "/account"),
      robots: { index: false, follow: false },
      ...withSocialImages(title, description, url),
    };
  }

  if (slug === "all-tools" || firstSeg === "all-tools") {
    const meta = LOCALE_ALL_TOOLS_SEO[locale] ?? LOCALE_ALL_TOOLS_SEO.en;
    const url = `${SITE_URL}/${locale}/all-tools`;
    return {
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords.split(",").map((k) => k.trim()),
      alternates: localeAlternates(locale, "/all-tools"),
      robots: { index: true, follow: true },
      ...withSocialImages(meta.title, meta.description, url),
    };
  }

  if (!slug) {
    const home = getLocalizedHomeSeo(locale);
    const url = `${SITE_URL}/${locale}`;
    return {
      title: home.title,
      description: home.description,
      alternates: localeAlternates(locale, ""),
      robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
      ...withSocialImages(home.title, home.description, url),
    };
  }

  if (bundle) {
    const title = formatToolSeoTitle(bundle.title, bundle.title);
    const url = `${SITE_URL}/${locale}${pathSuffix}`;
    return {
      title,
      description: bundle.description,
      keywords: bundle.keywords.split(",").map((k) => k.trim()),
      alternates: localeAlternates(locale, pathSuffix),
      robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
      ...withSocialImages(title, bundle.description, url),
    };
  }

  const fallbackTitle = slug
    .split("/")
    .pop()!
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const title = `${fallbackTitle} | PDFTrusted`;
  const description = `Use ${fallbackTitle} on ${BRAND_NAME}: fast, secure PDF processing with browser-first privacy and optional cloud acceleration for large files.`;

  const url = `${SITE_URL}/${locale}${pathSuffix}`;
  return {
    title,
    description,
    alternates: localeAlternates(locale, pathSuffix),
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    ...withSocialImages(title, description, url),
  };
}
