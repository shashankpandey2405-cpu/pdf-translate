"use client";

import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  toolName: string;
  slug?: string;
  className?: string;
};

/** Sticky premium breadcrumb: Home › Tool Name */
export function StickyToolBreadcrumbs({ toolName, className }: Props) {
  const { t, i18n } = useTranslation();
  const rtl = i18n.dir() === "rtl";

  return (
    <nav
      aria-label={t("nav.breadcrumb", { defaultValue: "Breadcrumb" })}
      className={cn(
        "sticky top-16 z-40 mb-4 w-full max-w-full border-b border-border/60 bg-background/85 py-2.5 backdrop-blur-md",
        "px-0 lg:-mx-6 lg:px-6",
        className,
      )}
    >
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <li className="shrink-0">
          <Link
            href="/"
            aria-label={t("nav.home", { defaultValue: "Home" })}
            className="press-scale inline-flex items-center gap-1 rounded-lg px-1.5 py-1 font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Home className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t("nav.home", { defaultValue: "Home" })}</span>
          </Link>
        </li>
        <li aria-hidden className="shrink-0">
          <ChevronRight className={cn("h-4 w-4 opacity-50", rtl && "rotate-180")} />
        </li>
        <li className="min-w-0 truncate font-semibold text-foreground" aria-current="page">
          {toolName}
        </li>
      </ol>
    </nav>
  );
}
