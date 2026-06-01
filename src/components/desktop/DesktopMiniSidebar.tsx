"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { DESKTOP_NAV_CATEGORIES } from "@/lib/desktop/navCatalog";
import { ToolIcon } from "@/components/home/ToolIcon";
import { cn } from "@/lib/utils";

type Props = {
  activeSlug?: string;
  className?: string;
};

export function DesktopMiniSidebar({ activeSlug, className }: Props) {
  const [location] = useLocation();
  const [hoverCat, setHoverCat] = useState<string | null>(null);

  const path = location.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  return (
    <aside
      className={cn(
        "master-mini-sidebar relative z-30 hidden h-full w-[104px] shrink-0 flex-col overflow-visible border-r border-border/70 bg-background/90 shadow-[4px_0_28px_-14px_rgba(15,23,42,0.1)] backdrop-blur-xl lg:flex dark:shadow-[4px_0_28px_-14px_rgba(0,0,0,0.3)]",
        className,
      )}
      aria-label="Tool categories"
    >
      <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-1 overflow-visible px-2 py-3">
        {DESKTOP_NAV_CATEGORIES.map((cat) => {
          const catActive =
            cat.tools.some((t) => t.slug === activeSlug) ||
            cat.tools.some((t) => path === t.href || path.startsWith(`${t.href}/`));
          const showFlyout = hoverCat === cat.id;

          return (
            <div
              key={cat.id}
              className="relative"
              onMouseEnter={() => setHoverCat(cat.id)}
              onMouseLeave={() => setHoverCat(null)}
            >
              <Link href={cat.primaryHref}>
                <span
                  className={cn(
                    "group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3.5 text-[11px] font-semibold leading-tight transition-all duration-200",
                    catActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <cat.icon
                    className={cn(
                      "h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-105",
                      catActive ? "text-primary-foreground" : "text-primary",
                    )}
                    aria-hidden
                  />
                  <span className="max-w-full text-center leading-snug">{cat.label}</span>
                </span>
              </Link>

              <AnimatePresence>
                {showFlyout && cat.tools.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-full top-1/2 z-[70] -translate-y-1/2 pl-2"
                  >
                    {/* Hover bridge — cursor can move into flyout without closing */}
                    <div className="desktop-mega-panel min-w-[232px] rounded-2xl border border-border/80 bg-card p-2 shadow-[0_24px_56px_-20px_rgba(15,23,42,0.28)] dark:shadow-[0_24px_56px_-20px_rgba(0,0,0,0.5)]">
                      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {cat.label}
                      </p>
                      <ul className="max-h-[min(70vh,420px)] space-y-0.5 overflow-y-auto">
                        {cat.tools.map((tool) => {
                          const toolActive = tool.slug === activeSlug || path === tool.href;
                          return (
                            <li key={tool.href}>
                              <Link href={tool.href}>
                                <span
                                  className={cn(
                                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
                                    toolActive
                                      ? "bg-primary/10 font-semibold text-primary"
                                      : "text-foreground hover:bg-primary/5",
                                  )}
                                >
                                  <ToolIcon slug={tool.slug} className="h-4 w-4 shrink-0 text-primary" />
                                  {tool.label}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
