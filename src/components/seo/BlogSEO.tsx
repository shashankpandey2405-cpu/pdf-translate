"use client";

import { Helmet } from "react-helmet-async";
import { BRAND_LOGO_URL } from "@/lib/branding";
import { BRAND_NAME, SITE_URL, SUPPORTED_LOCALES, REGION_HREFLANG_TARGETS } from "@/lib/seo/site";
import type { BlogPost } from "@/data/blog/posts";

type Props = {
  post?: BlogPost;
  isIndex?: boolean;
  lang?: string;
};

const SUPPORTED = [...SUPPORTED_LOCALES];

export function BlogSEO({ post, isIndex, lang = "en" }: Props) {
  if (isIndex) {
    const title = `AI PDF Blog — Tips, Guides & Comparisons | ${BRAND_NAME}`;
    const description =
      "Expert guides on AI PDF compression, OCR, translation, document chat, and more. Tips for students and businesses in the USA, India, UAE, UK, Canada, Australia, and Singapore.";
    const url = `${SITE_URL}/${lang}/blog`;

    const collectionPage = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
      isPartOf: { "@type": "WebSite", name: BRAND_NAME, url: SITE_URL },
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
        { "@type": "ListItem", position: 2, name: "Blog", item: url },
      ],
    };

    return (
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="AI PDF tools blog, PDF compression guide, chat with PDF, OCR tutorial, PDF tools USA, PDF tools India, PDF tools UAE, PDF tools UK"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        {SUPPORTED.map((locale) => (
          <link key={locale} rel="alternate" hrefLang={locale} href={`${SITE_URL}/${locale}/blog`} />
        ))}
        {REGION_HREFLANG_TARGETS.map((region) => (
          <link key={region} rel="alternate" hrefLang={region} href={`${SITE_URL}/en/blog`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en/blog`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={BRAND_NAME} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={BRAND_LOGO_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={BRAND_LOGO_URL} />
        <script type="application/ld+json">{JSON.stringify(collectionPage)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>
    );
  }

  if (!post) return null;

  const slug = `blog/${post.slug}`;
  const canonicalUrl = `${SITE_URL}/${lang}/${slug}`;
  const fullTitle = `${post.metaTitle}`;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    url: canonicalUrl,
    datePublished: post.publishDate,
    dateModified: post.publishDate,
    author: { "@type": "Organization", name: BRAND_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: BRAND_LOGO_URL },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    inLanguage: "en",
    keywords: post.keywords,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/${lang}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  const faqLd =
    post.faqs && post.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }
      : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={post.metaDescription} />
      <meta name="keywords" content={post.keywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />
      {SUPPORTED.map((locale) => (
        <link key={locale} rel="alternate" hrefLang={locale} href={`${SITE_URL}/${locale}/${slug}`} />
      ))}
      {REGION_HREFLANG_TARGETS.map((region) => (
        <link key={region} rel="alternate" hrefLang={region} href={`${SITE_URL}/en/${slug}`} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/en/${slug}`} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={BRAND_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={post.metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={BRAND_LOGO_URL} />
      <meta property="article:published_time" content={post.publishDate} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={post.metaDescription} />
      <meta name="twitter:image" content={BRAND_LOGO_URL} />
      <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      {faqLd ? <script type="application/ld+json">{JSON.stringify(faqLd)}</script> : null}
    </Helmet>
  );
}
