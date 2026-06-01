"use client";

import { Link, useRoute } from "wouter";
import { ArrowLeft, Check, Scale, Sparkles, X, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CompareSEO } from "@/components/seo/CompareSEO";
import { COMPARE_SLUGS } from "@/data/seo/comparePages";
import { getLocalizedCompareCompetitor } from "@/lib/seo/localizedCompareSeo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ResponsiveComparisonTable } from "@/components/layout/ResponsiveComparisonTable";

function AdobeSplitHero() {
  const { t } = useTranslation();
  return (
    <section className="mb-10 grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border border-slate-300/60 bg-slate-100/80 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Adobe Acrobat</p>
        <h2 className="mt-2 text-xl font-bold text-slate-700 dark:text-slate-300">
          {t("compare.adobe.slowTitle", { defaultValue: "Slow & Expensive" })}
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-2">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
            {t("compare.adobe.point1", { defaultValue: "$19.99/mo desktop subscription" })}
          </li>
          <li className="flex gap-2">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
            {t("compare.adobe.point2", { defaultValue: "Heavy install & Creative Cloud" })}
          </li>
          <li className="flex gap-2">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
            {t("compare.adobe.point3", { defaultValue: "Basic AI locked behind enterprise tiers" })}
          </li>
        </ul>
      </div>
      <div className="rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-[0_0_30px_rgba(79,70,229,0.12)] dark:from-indigo-950/40 dark:to-slate-900">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          PDFTrusted
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
          {t("compare.adobe.fastTitle", { defaultValue: "Fast & AI-First" })}
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex gap-2">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
            {t("compare.adobe.win1", { defaultValue: "Free core tools + affordable Pro" })}
          </li>
          <li className="flex gap-2">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
            {t("compare.adobe.win2", { defaultValue: "Instant web — no install" })}
          </li>
          <li className="flex gap-2">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
            {t("compare.adobe.win3", { defaultValue: "Advanced Neural AI built-in" })}
          </li>
        </ul>
        <Link
          href="/pricing"
          className="shimmer-btn press-scale mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          {t("pricingPage.plans.pro.cta", { defaultValue: "Get Pro" })}
        </Link>
      </div>
    </section>
  );
}

export default function ComparePage() {
  const { i18n, t } = useTranslation();
  const [, params] = useRoute("/compare/:competitor");
  const slug = params?.competitor ?? "";
  const data = getLocalizedCompareCompetitor(i18n.language, slug);

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-lg font-semibold text-foreground">Comparison not found</p>
        <Link href="/compare" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to comparisons
        </Link>
      </div>
    );
  }

  const seoSlug = `compare/${data.slug}`;

  return (
    <article className="app-page mx-auto w-full min-w-0 max-w-4xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-10 sm:py-14">
      <CompareSEO
        title={data.metaTitle}
        description={data.metaDescription}
        slug={seoSlug}
        lang={i18n.language}
        keywords={data.keywords}
        faqs={data.faqs}
        competitorName={data.name}
      />

      <Link
        href="/compare"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("compare.backToHub", { defaultValue: "All comparisons" })}
      </Link>

      <header className="mb-8 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Scale className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            PDFTrusted vs {data.name}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{data.tagline}</p>
        </div>
      </header>

      {slug === "adobe-acrobat" ? <AdobeSplitHero /> : null}

      {data.intro.map((p, i) => (
        <p key={i} className="mb-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {p}
        </p>
      ))}

      <section className="mt-10" aria-labelledby="compare-matrix-heading">
        <h2 id="compare-matrix-heading" className="text-lg font-bold text-foreground">
          {t("compare.featureMatrix", { defaultValue: "Feature comparison" })}
        </h2>
        <ResponsiveComparisonTable
          className="mt-4"
          colAHeader="PDFTrusted"
          colBHeader={data.name}
          rows={data.rows.map((row) => ({
            feature: row.feature,
            colA: row.pdftrusted,
            colB: row.competitor,
          }))}
        />
      </section>

      <section className="mt-10" aria-labelledby="advantages-heading">
        <h2 id="advantages-heading" className="text-lg font-bold text-foreground">
          {t("compare.whyPdftrusted", { defaultValue: "Why teams choose PDFTrusted" })}
        </h2>
        <ul className="mt-4 space-y-4">
          {data.advantages.map((a) => (
            <li
              key={a.title}
              className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 sm:px-5"
            >
              <p className="flex items-start gap-2 font-semibold text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {a.title}
              </p>
              <p className="mt-2 pl-6 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="try-tools-heading">
        <h2 id="try-tools-heading" className="text-lg font-bold text-foreground">
          {t("compare.tryTools", { defaultValue: "Try PDFTrusted free" })}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.recommendedTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/5"
            >
              {tool.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-muted/30 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("compare.alsoCompare", { defaultValue: "Also compare" })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMPARE_SLUGS.filter((s) => s !== data.slug).map((s) => {
            const other = getLocalizedCompareCompetitor(i18n.language, s)!;
            return (
              <Link
                key={s}
                href={`/compare/${s}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                vs {other.name}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-10">
        <h2 className="text-lg font-bold text-foreground">
          {t("seo.knowledgeHub.faqHeading", { defaultValue: "Frequently asked questions" })}
        </h2>
        <Accordion type="single" collapsible className="mt-4 w-full rounded-2xl border border-border bg-card px-4">
          {data.faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`faq-${i}`}>
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
    </article>
  );
}
