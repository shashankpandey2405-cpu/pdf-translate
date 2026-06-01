"use client";

import { Link, useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { HelpCenterLayout } from "@/components/help/HelpCenterLayout";
import { HelpPageSEO } from "@/components/seo/HelpPageSEO";
import { getLearnArticle } from "@/data/help/learnArticles";
import { getToolHref } from "../../../constants/tools";

export default function LearnArticlePage() {
  const { i18n } = useTranslation();
  const [, params] = useRoute("/learn/:topic");
  const topic = params?.topic ?? "";
  const article = getLearnArticle(topic);

  if (!article) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-semibold">Article not found</p>
        <Link href="/learn" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Learn
        </Link>
      </div>
    );
  }

  return (
    <>
      <HelpPageSEO
        title={article.title}
        description={article.description}
        path={`/learn/${topic}`}
        lang={i18n.language}
        schemaType="article"
      />
      <HelpCenterLayout
        title={article.title}
        subtitle={article.description}
        breadcrumbs={[
          { label: "Help", href: "/help" },
          { label: "Learn", href: "/learn" },
          { label: article.title },
        ]}
      >
        {article.sections.map((section) => (
          <section key={section.heading} className="mb-8">
            <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        {article.faqs.length > 0 ? (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground">FAQ</h2>
            <ul className="mt-4 space-y-3">
              {article.faqs.map((f) => (
                <li key={f.question} className="rounded-xl border border-border/60 bg-card px-4 py-3">
                  <p className="font-semibold text-foreground">{f.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {article.relatedTools && article.relatedTools.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Related tools</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {article.relatedTools.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={getToolHref({ slug: t.slug })}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium text-primary hover:bg-muted"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </HelpCenterLayout>
    </>
  );
}
