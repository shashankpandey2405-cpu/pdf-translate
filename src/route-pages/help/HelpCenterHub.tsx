"use client";

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { HelpCenterLayout } from "@/components/help/HelpCenterLayout";
import { HelpPageSEO } from "@/components/seo/HelpPageSEO";
import {
  GUIDE_TOOL_SLUGS,
  HELP_TOPICS,
  LEARN_TOPICS,
  PILOT_GUIDE_SLUGS,
  getGuideBundle,
  toolDisplayNameFromBundle,
} from "@/data/help/helpCenterRegistry";
import { getToolHref } from "../../../constants/tools";

export default function HelpCenterHub() {
  const { t, i18n } = useTranslation();
  const title = t("helpCenter.hubTitle", { defaultValue: "PDFTrusted Help Center" });
  const subtitle = t("helpCenter.hubSubtitle", {
    defaultValue: "Guides, FAQs, and platform documentation — separate from the tools so you can get answers fast.",
  });

  const popularGuides = PILOT_GUIDE_SLUGS.map((slug) => {
    const bundle = getGuideBundle(slug);
    return {
      slug,
      name: toolDisplayNameFromBundle(slug, bundle),
      href: `/guides/${slug}`,
      toolHref: getToolHref({ slug }),
    };
  });

  return (
    <>
      <HelpPageSEO title={title} description={subtitle} path="/help" lang={i18n.language} schemaType="article" />
      <HelpCenterLayout title={title} subtitle={subtitle}>
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              {t("helpCenter.popularGuides", { defaultValue: "Popular tool guides" })}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {popularGuides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={g.href}
                    className="block rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted/40"
                  >
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/guides" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              {t("helpCenter.allGuides", { defaultValue: "Browse all tool guides →" })}
            </Link>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              {t("helpCenter.topics", { defaultValue: "Help topics" })}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {HELP_TOPICS.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={topic.href}
                    className="block rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium transition hover:border-primary/40"
                  >
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              {t("helpCenter.learn", { defaultValue: "Learn about PDFTrusted" })}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {LEARN_TOPICS.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={topic.href}
                    className="block rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium transition hover:border-primary/40"
                  >
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border/60 bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
            <p>
              {t("helpCenter.hubNote", {
                defaultValue: "{{count}} tools have dedicated guides. Open any tool to upload and process — help links sit below the workspace.",
                count: GUIDE_TOOL_SLUGS.length,
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/how-to-use" className="font-semibold text-primary hover:underline">
                {t("layout.howToLink", { defaultValue: "How to use PDFTrusted" })}
              </Link>
              <Link href="/faq" className="font-semibold text-primary hover:underline">
                {t("nav.resources.faq", { defaultValue: "FAQ" })}
              </Link>
              <Link href="/contact" className="font-semibold text-primary hover:underline">
                {t("nav.resources.contact", { defaultValue: "Contact" })}
              </Link>
            </div>
          </section>
        </div>
      </HelpCenterLayout>
    </>
  );
}
