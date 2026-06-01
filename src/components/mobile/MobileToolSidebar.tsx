"use client";

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DESKTOP_NAV_CATEGORIES } from "@/lib/desktop/navCatalog";
import { ToolIcon } from "@/components/home/ToolIcon";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileToolSidebar({ open, onOpenChange }: Props) {
  const [location] = useLocation();
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const path = location.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  const toggleCategory = (id: string) => {
    setExpandedCat((prev) => (prev === id ? null : id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(80vw,18rem)] overflow-y-auto overscroll-contain p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="border-b border-border/60 px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-5 w-5 text-primary" />
            PDF Tools
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-0.5 px-2 py-3" aria-label="Tool categories">
          {DESKTOP_NAV_CATEGORIES.map((cat) => {
            const isExpanded = expandedCat === cat.id;
            const catActive =
              cat.tools.some((t) => path === t.href || path.startsWith(`${t.href}/`));

            return (
              <div key={cat.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors",
                    catActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <cat.icon
                    className={cn("h-5 w-5 shrink-0", catActive ? "text-primary" : "text-muted-foreground")}
                    aria-hidden
                  />
                  <span className="flex-1">{cat.label}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-90",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && cat.tools.length > 0 ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-0.5 pb-1 pl-3 pt-1">
                        {cat.tools.map((tool) => {
                          const toolActive = path === tool.href || path.startsWith(`${tool.href}/`);
                          return (
                            <li key={tool.href}>
                              <Link
                                href={tool.href}
                                onClick={() => onOpenChange(false)}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                  toolActive
                                    ? "bg-primary/10 font-semibold text-primary"
                                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                                )}
                              >
                                <ToolIcon slug={tool.slug} className="h-4 w-4 shrink-0 text-primary/70" />
                                <span className="truncate">{tool.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
