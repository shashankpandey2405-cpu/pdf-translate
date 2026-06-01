"use client";

import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
};

const SIDEBAR_LINKS = [
  { href: "/help", label: "Help home" },
  { href: "/guides", label: "Tool guides" },
  { href: "/learn", label: "Learn" },
  { href: "/faq", label: "FAQ hub" },
  { href: "/how-to-use", label: "How to use" },
];

export function HelpCenterLayout({ title, subtitle, children, breadcrumbs }: Props) {
  const { t } = useTranslation();
  const [pathname] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <BookOpen className="h-4 w-4" aria-hidden />
              {t("helpCenter.badge", { defaultValue: "Help Center" })}
            </span>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb" className="mt-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, i) => (
                  <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
                    {i > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
                    {crumb.href ? (
                      <Link href={crumb.href} className="font-medium text-primary hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            ) : null}
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="Help Center" className="sticky top-24 space-y-1">
            {SIDEBAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
