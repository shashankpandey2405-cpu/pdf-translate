"use client";

import { useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { buildRelatedToolLinks } from "@/lib/seo/toolInterlinking";
import { resolveCanonicalToolPath } from "@/lib/seo/localeSlugAliases";
import { ToolIcon } from "@/components/home/ToolIcon";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  variant?: "horizontal" | "sidebar";
  className?: string;
};

/** 1-click related tool switcher — horizontal scroll on mobile, sidebar on desktop. */
export function ToolQuickSwitcher({ slug, variant = "horizontal", className }: Props) {
  const { t, i18n } = useTranslation();
  const canonical =
    resolveCanonicalToolPath(i18n.language, slug.replace(/^\//, "")) ?? slug.replace(/^\//, "");

  const links = useMemo(
    () => buildRelatedToolLinks(i18n.language, canonical).slice(0, 6),
    [canonical, i18n.language],
  );

  if (links.length === 0) return null;

  if (variant === "sidebar") {
    return (
      <aside
        className={cn("sticky top-28 hidden lg:block", className)}
        aria-label={t("seo.relatedTools.nav", { defaultValue: "Related PDF tools" })}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("seo.relatedTools.heading", { defaultValue: "Related tools" })}
        </p>
        <ul className="mt-3 space-y-1.5">
          {links.map((item) => {
            const label = t(item.labelKey, {
              defaultValue: item.canonicalSlug.replace(/-/g, " "),
            });
            return (
              <li key={item.canonicalSlug}>
                <Link
                  href={item.href}
                  aria-label={label}
                  className="press-scale flex min-h-[44px] items-center gap-2.5 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                    <ToolIcon slug={item.canonicalSlug} className="h-4 w-4" label={label} />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    );
  }

  return (
    <nav
      className={cn("w-full min-w-0", className)}
      aria-label={t("seo.relatedTools.nav", { defaultValue: "Related PDF tools" })}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("seo.relatedTools.switch", { defaultValue: "Switch tool" })}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scroll-touch snap-x snap-mandatory touch-pan-x [-webkit-overflow-scrolling:touch]">
        {links.map((item) => {
          const label = t(item.labelKey, {
            defaultValue: item.canonicalSlug.replace(/-/g, " "),
          });
          return (
            <Link
              key={item.canonicalSlug}
              href={item.href}
              aria-label={label}
              className="press-scale flex min-h-[44px] min-w-[100px] shrink-0 snap-start flex-col items-start justify-center gap-2 rounded-2xl border border-slate-200/60 bg-white/70 p-3 shadow-sm backdrop-blur-md transition-colors hover:border-indigo-400/40 dark:border-slate-700/50 dark:bg-slate-900/70"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-indigo-600/25">
                <ToolIcon slug={item.canonicalSlug} className="h-5 w-5" label={label} />
              </span>
              <span className="line-clamp-2 text-xs font-bold leading-tight text-foreground">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
