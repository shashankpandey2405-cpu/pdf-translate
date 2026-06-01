"use client";

import { Link } from "wouter";
import { useGuideSlug } from "@/hooks/useHelpRouteSlug";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HelpCenterLayout } from "@/components/help/HelpCenterLayout";
import { HelpPageSEO } from "@/components/seo/HelpPageSEO";
import {
  faqPathForSlug,
  getGuideBundle,
  getHelpLinksForTool,
  toolDisplayNameFromBundle,
} from "@/data/help/helpCenterRegistry";
import { getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { getToolHref } from "../../../constants/tools";

export default function ToolGuidePage() {
  const { i18n } = useTranslation();
  const slug = useGuideSlug();
  const bundle = getLocalizedToolSeoBundle(i18n.language, slug) ?? getGuideBundle(slug);
  const toolName = toolDisplayNameFromBundle(slug, bundle);
  const toolHref = getToolHref({ slug, routePath: slug.startsWith("tools/") ? `/${slug}` : undefined });

  if (!bundle) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-semibold">Guide not found</p>
        <Link href="/guides" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← All guides
        </Link>
      </div>
    );
  }

  const description = bundle.description;

  return (
    <>
      <HelpPageSEO
        title={`${toolName} — Guide`}
        description={description}
        path={`/guides/${slug}`}
        lang={i18n.language}
        bundle={bundle}
        schemaType="guide"
      />
      <HelpCenterLayout
        title={`How to use ${toolName}`}
        subtitle={description}
        breadcrumbs={[
          { label: "Help", href: "/help" },
          { label: "Guides", href: "/guides" },
          { label: toolName },
        ]}
      >
        <Link
          href={toolHref}
          className="mb-8 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Open {toolName} tool
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>

        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          {bundle.bodyParagraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Steps</h2>
          <ol className="mt-4 space-y-4">
            {bundle.howToSteps.map((step, i) => (
              <li key={step.name} className="flex gap-4 rounded-xl border border-border/60 bg-card px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{step.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <nav className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link href={faqPathForSlug(slug)} className="font-semibold text-primary hover:underline">
            {toolName} FAQ →
          </Link>
          <Link href={getHelpLinksForTool(slug).toolHref} className="font-semibold text-primary hover:underline">
            Use the tool →
          </Link>
        </nav>
      </HelpCenterLayout>
    </>
  );
}
