"use client";

import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { DESKTOP_NAV_CATEGORIES, type DesktopNavCategory } from "@/lib/desktop/navCatalog";
import { ToolIcon } from "@/components/home/ToolIcon";
import { cn } from "@/lib/utils";

type Props = {
  category: DesktopNavCategory;
  open: boolean;
};

export function DesktopMegaMenu({ category, open }: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="desktop-mega-panel absolute left-1/2 top-full z-[60] mt-2 w-[min(720px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border/80 bg-white/95 p-5 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.22)] backdrop-blur-xl"
          role="menu"
        >
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {category.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Choose a tool — opens instantly</p>
            </div>
            <Link
              href={category.primaryHref}
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {category.tools.map((tool) => (
              <Link
                key={tool.slug + tool.href}
                href={tool.href}
                role="menuitem"
                className={cn(
                  "group flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
                  "hover:bg-primary/5 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.15)]",
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary transition group-hover:bg-primary/10">
                  <ToolIcon slug={tool.slug} className="h-5 w-5" />
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                    {tool.label}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function useNavCategories() {
  return DESKTOP_NAV_CATEGORIES;
}
