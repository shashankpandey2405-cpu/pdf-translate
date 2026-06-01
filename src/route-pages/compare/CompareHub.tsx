"use client";

import { Link } from "wouter";
import { ArrowRight, Gauge, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CompareSEO } from "@/components/seo/CompareSEO";
import { COMPARE_SLUGS } from "@/data/seo/comparePages";
import { getLocalizedCompareCompetitor, getLocalizedCompareHub } from "@/lib/seo/localizedCompareSeo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function CompareHub() {
  const { i18n, t } = useTranslation();
  const hub = getLocalizedCompareHub(i18n.language);

  return (
    <div className="app-page mx-auto w-full min-w-0 max-w-4xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-10 sm:py-14">
      <CompareSEO
        title={hub.metaTitle}
        description={hub.metaDescription}
        slug="compare"
        lang={i18n.language}
        keywords={hub.keywords}
        faqs={hub.faqs}
      />

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Scale className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("compare.hubTitle", { defaultValue: "Compare PDF tools" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {t("compare.hubSubtitle", {
              defaultValue: "Hybrid AI PDF Platform — honest comparisons and measured speed benchmarks.",
            })}
          </p>
        </div>
      </div>

      {hub.intro.map((p, i) => (
        <p key={i} className="mb-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {p}
        </p>
      ))}

      <Link
        href="/compare/speed"
        className="group mt-6 flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
            <Gauge className="h-5 w-5 text-indigo-600" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {t("compare.speedLinkTitle", { defaultValue: "Speed benchmarks (measured)" })}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("compare.speedLinkDesc", {
                defaultValue: "Real Private Local vs Turbo Cloud timings — no fake competitor claims.",
              })}
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-indigo-600 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="mt-8 grid gap-4 sm:grid-cols-1">
        {COMPARE_SLUGS.map((slug) => {
          const c = getLocalizedCompareCompetitor(i18n.language, slug)!;
          return (
            <Link
              key={slug}
              href={`/compare/${slug}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div>
                <p className="text-lg font-semibold text-foreground">PDFTrusted vs {c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.tagline}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>

      <section className="mt-12 border-t border-border pt-10">
        <h2 className="text-lg font-bold text-foreground">
          {t("seo.knowledgeHub.faqHeading", { defaultValue: "Frequently asked questions" })}
        </h2>
        <Accordion type="single" collapsible className="mt-4 w-full rounded-2xl border border-border bg-card px-4">
          {hub.faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`hub-faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
