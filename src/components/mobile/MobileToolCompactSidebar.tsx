"use client";

import { Link, useLocation } from "wouter";
import { DESKTOP_NAV_CATEGORIES } from "@/lib/desktop/navCatalog";
import { cn } from "@/lib/utils";

type Props = {
  activeSlug?: string;
  className?: string;
};

export function MobileToolCompactSidebar({ activeSlug, className }: Props) {
  const [location] = useLocation();
  const path = location.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  return (
    <aside
      className={cn(
        "fixed left-0 top-12 z-30 flex w-[52px] flex-col overflow-y-auto overflow-x-hidden overscroll-contain border-r border-border/60 bg-background/95 backdrop-blur-md",
        "bottom-[calc(4rem+env(safe-area-inset-bottom))] pt-1 pb-1",
        "lg:hidden",
        className,
      )}
      aria-label="Tool categories"
    >
      {DESKTOP_NAV_CATEGORIES.map((cat) => {
        const catActive =
          cat.tools.some((t) => t.slug === activeSlug) ||
          cat.tools.some(
            (t) => path === t.href || path.startsWith(`${t.href}/`),
          );

        return (
          <Link key={cat.id} href={cat.primaryHref}>
            <span
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[9px] font-semibold leading-tight transition-colors",
                catActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground active:bg-muted",
              )}
            >
              <cat.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  catActive ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span className="max-w-full truncate text-center leading-tight">
                {cat.label}
              </span>
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
