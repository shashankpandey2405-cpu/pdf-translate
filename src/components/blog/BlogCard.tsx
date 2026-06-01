"use client";

import { Link } from "wouter";
import { ArrowRight, Calendar, Clock, Globe, MapPin } from "lucide-react";
import type { BlogPost } from "@/data/blog/posts";

const CATEGORY_META: Record<BlogPost["category"], { label: string; icon: typeof Globe; className: string }> = {
  global: { label: "Global", icon: Globe, className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300" },
  usa: { label: "USA", icon: MapPin, className: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300" },
  india: { label: "India", icon: MapPin, className: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300" },
  uae: { label: "UAE", icon: MapPin, className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" },
  uk: { label: "UK", icon: MapPin, className: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300" },
  canada: { label: "Canada", icon: MapPin, className: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300" },
  australia: { label: "Australia", icon: MapPin, className: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" },
  singapore: { label: "Singapore", icon: MapPin, className: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300" },
};

export function BlogCard({ post }: { post: BlogPost }) {
  const cat = CATEGORY_META[post.category];
  const CatIcon = cat.icon;

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cat.className}`}>
            <CatIcon className="h-3 w-3" />
            {cat.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {post.readTime}
          </span>
        </div>

        <h3 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
          {post.title}
        </h3>

        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(post.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Read <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </article>
    </Link>
  );
}
