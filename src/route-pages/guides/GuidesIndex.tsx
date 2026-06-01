"use client";

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { HelpCenterLayout } from "@/components/help/HelpCenterLayout";
import { HelpPageSEO } from "@/components/seo/HelpPageSEO";
import {
  GUIDE_TOOL_SLUGS,
  getGuideBundle,
  guidePathForSlug,
  toolDisplayNameFromBundle,
} from "@/data/help/helpCenterRegistry";

export default function GuidesIndex() {
  const { t, i18n } = useTranslation();
  const title = t("helpCenter.guidesIndexTitle", { defaultValue: "Tool guides" });
  const subtitle = t("helpCenter.guidesIndexSubtitle", {
    defaultValue: "Step-by-step instructions for every PDFTrusted tool.",
  });

  const guides = GUIDE_TOOL_SLUGS.map((slug) => {
    const bundle = getGuideBundle(slug);
    return {
      slug,
      name: toolDisplayNameFromBundle(slug, bundle),
      description: bundle?.description ?? "",
      href: guidePathForSlug(slug),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <HelpPageSEO title={title} description={subtitle} path="/guides" lang={i18n.language} />
      <HelpCenterLayout
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: "Help", href: "/help" }, { label: "Guides" }]}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={g.href}
                className="block rounded-xl border border-border/60 bg-card px-4 py-3 transition hover:border-primary/40"
              >
                <p className="font-semibold text-foreground">{g.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </HelpCenterLayout>
    </>
  );
}
