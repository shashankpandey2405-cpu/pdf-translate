"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { buildRelatedToolLinks } from "@/lib/seo/toolInterlinking";
import { resolveCanonicalToolPath } from "@/lib/seo/localeSlugAliases";

interface Props {
  /** Route slug, e.g. merge-pdf or tools/ai-scanner */
  slug: string;
}

/**
 * Internal links for crawl depth + user journeys. Uses locale SEO aliases when available.
 */
export function ToolRelatedLinks({ slug }: Props) {
  const { t, i18n } = useTranslation();
  const canonical =
    resolveCanonicalToolPath(i18n.language, slug.replace(/^\//, "")) ?? slug.replace(/^\//, "");

  const links = useMemo(
    () => buildRelatedToolLinks(i18n.language, canonical),
    [canonical, i18n.language],
  );

  if (links.length === 0) return null;

  return (
    <nav
      className="mt-8 rounded-2xl border border-border bg-muted/20 px-4 py-5 sm:px-6"
      aria-label={t("seo.relatedTools.nav", { defaultValue: "Related PDF tools" })}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
        {t("seo.relatedTools.heading", { defaultValue: "Related tools" })}
      </h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((item) => (
          <li key={item.canonicalSlug}>
            <Link
              href={item.href}
              className="inline-flex rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {t(item.labelKey, {
                defaultValue: item.canonicalSlug.replace(/-/g, " "),
              })}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/all-tools"
            className="inline-flex rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("seo.relatedTools.allTools", { defaultValue: "All tools" })}
          </Link>
        </li>
        <li>
          <Link
            href="/compare"
            className="inline-flex rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("seo.relatedTools.compare", { defaultValue: "Compare PDF tools" })}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
