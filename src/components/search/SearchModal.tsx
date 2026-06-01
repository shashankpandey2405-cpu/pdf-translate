"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  placeholder?: string;
  /** Controlled search value for header display (optional — cmdk manages its own input inside children) */
  showHeader?: boolean;
};

/**
 * Mobile-first search overlay with Framer Motion. Wraps CommandPalette list content.
 */
export function SearchModal({ open, onOpenChange, children, showHeader = true }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="search-modal"
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-hidden bg-background/80 p-4 pt-[10dvh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Search tools"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            className={cn(
              "flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl",
              "max-h-[min(85dvh,640px)]",
            )}
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            {showHeader ? (
              <div className="flex shrink-0 items-center border-b border-border/50 px-4 py-3">
                <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-sm text-muted-foreground">Search tools…</span>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="press-scale rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-foreground"
                  aria-label="Close search"
                >
                  ESC
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="press-scale ml-2 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
