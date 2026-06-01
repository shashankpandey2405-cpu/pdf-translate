"use client";

import { Link, useRoute } from "wouter";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BlogSEO } from "@/components/seo/BlogSEO";
import { getBlogPost } from "@/data/blog/posts";
import { findToolBySlug, getToolHref } from "../../../constants/tools";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function BlogPost() {
  const { i18n, t } = useTranslation();
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-lg font-semibold text-foreground">Post not found</p>
        <Link href="/blog" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          &larr; Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="app-page mx-auto w-full min-w-0 max-w-3xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-10 sm:py-14">
      <BlogSEO post={post} lang={i18n.language} />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl leading-tight">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.publishDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime} read
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {post.excerpt}
        </p>
      </header>

      <div className="mt-8 space-y-8">
        {post.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">{section.heading}</h2>
            <div
              className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base [&_strong]:font-semibold [&_strong]:text-foreground"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </section>
        ))}
      </div>

      {post.faqs && post.faqs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="mt-4 w-full space-y-2">
            {post.faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border bg-card px-4 sm:px-6 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {post.relatedTools.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-foreground">Try These Tools</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.relatedTools.map((toolSlug) => {
              const tool = findToolBySlug(toolSlug, t);
              if (!tool) return null;
              return (
                <Link
                  key={toolSlug}
                  href={getToolHref(tool)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {tool.label}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12 border-t border-border pt-6 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          All Blog Posts
        </Link>
      </div>
    </article>
  );
}
