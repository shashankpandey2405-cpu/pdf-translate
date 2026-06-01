"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { BlogSEO } from "@/components/seo/BlogSEO";
import { BlogCard } from "@/components/blog/BlogCard";
import { BLOG_POSTS, type BlogPost } from "@/data/blog/posts";

const CATEGORIES: Array<{ key: BlogPost["category"] | "all"; label: string }> = [
  { key: "all", label: "All Posts" },
  { key: "global", label: "Global" },
  { key: "usa", label: "USA" },
  { key: "india", label: "India" },
  { key: "uae", label: "UAE" },
  { key: "uk", label: "UK" },
  { key: "canada", label: "Canada" },
  { key: "australia", label: "Australia" },
  { key: "singapore", label: "Singapore" },
];

export default function BlogIndex() {
  const { i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<BlogPost["category"] | "all">("all");

  const filtered =
    activeCategory === "all" ? BLOG_POSTS : BLOG_POSTS.filter((p) => p.category === activeCategory);

  return (
    <div className="app-page mx-auto w-full min-w-0 max-w-5xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-10 sm:py-14">
      <BlogSEO isIndex lang={i18n.language} />

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <BookOpen className="h-3 w-3" />
          Blog
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          AI PDF Tools — Guides, Tips & Insights
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Expert articles on PDF compression, OCR, translation, document chat, and productivity
          tips for users in the USA, India, UAE, UK, Canada, Australia, Singapore, and worldwide.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              activeCategory === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          No posts in this category yet. Check back soon!
        </p>
      )}
    </div>
  );
}
