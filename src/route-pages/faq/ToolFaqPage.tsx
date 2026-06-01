"use client";

import { Link } from "wouter";
import { useFaqSlug } from "@/hooks/useHelpRouteSlug";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HelpCenterLayout } from "@/components/help/HelpCenterLayout";
import { HelpPageSEO } from "@/components/seo/HelpPageSEO";
import {
  getGuideBundle,
  guidePathForSlug,
  toolDisplayNameFromBundle,
} from "@/data/help/helpCenterRegistry";
import { getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { getToolHref } from "../../../constants/tools";

export default function ToolFaqPage() {
  const { i18n } = useTranslation();
  const slug = useFaqSlug();
  const bundle = getLocalizedToolSeoBundle(i18n.language, slug) ?? getGuideBundle(slug);
  const toolName = toolDisplayNameFromBundle(slug, bundle);
  const toolHref = getToolHref({ slug, routePath: slug.startsWith("tools/") ? `/${slug}` : undefined });

  if (!bundle || bundle.faqs.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-semibold">FAQ not found</p>
        <Link href="/faq" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← FAQ hub
        </Link>
      </div>
    );
  }

  return (
    <>
      <HelpPageSEO
        title={`${toolName} — FAQ`}
        description={bundle.faqs[0]?.answer ?? bundle.description}
        path={`/faq/${slug}`}
        lang={i18n.language}
        bundle={bundle}
        schemaType="faq"
      />
      <HelpCenterLayout
        title={`${toolName} FAQ`}
        subtitle={bundle.description}
        breadcrumbs={[
          { label: "FAQ", href: "/faq" },
          { label: toolName },
        ]}
      >
        <Link
          href={toolHref}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Open {toolName} tool
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>

        <ul className="space-y-4">
          {bundle.faqs.map((f) => (
            <li key={f.question} className="rounded-xl border border-border/60 bg-card px-4 py-4">
              <h2 className="text-base font-semibold text-foreground">{f.question}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
            </li>
          ))}
        </ul>

        <Link href={guidePathForSlug(slug)} className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
          Read the full {toolName} guide →
        </Link>
      </HelpCenterLayout>
    </>
  );
}
