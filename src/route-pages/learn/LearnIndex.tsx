"use client";

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { HelpCenterLayout } from "@/components/help/HelpCenterLayout";
import { HelpPageSEO } from "@/components/seo/HelpPageSEO";
import { LEARN_TOPICS } from "@/data/help/helpCenterRegistry";
import { getLearnArticle } from "@/data/help/learnArticles";
import { getToolHref } from "../../../constants/tools";

export default function LearnIndex() {
  const { t, i18n } = useTranslation();
  const title = t("helpCenter.learnIndexTitle", { defaultValue: "Learn about PDFTrusted" });
  const subtitle = t("helpCenter.learnIndexSubtitle", {
    defaultValue: "Authoritative articles on security, processing technology, and AI — optimized for clarity and discovery.",
  });

  return (
    <>
      <HelpPageSEO title={title} description={subtitle} path="/learn" lang={i18n.language} />
      <HelpCenterLayout
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: "Help", href: "/help" }, { label: "Learn" }]}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {LEARN_TOPICS.map((topic) => {
            const article = getLearnArticle(topic.slug);
            return (
              <li key={topic.slug}>
                <Link
                  href={topic.href}
                  className="block rounded-xl border border-border/60 bg-card px-4 py-3 transition hover:border-primary/40"
                >
                  <p className="font-semibold text-foreground">{topic.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article?.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </HelpCenterLayout>
    </>
  );
}
