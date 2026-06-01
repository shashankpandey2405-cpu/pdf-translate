"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  suggestions?: string[];
  className?: string;
};

export function ToolErrorState({
  title = "Something went wrong",
  message = "We couldn't process your file. Please try again.",
  onRetry,
  retryLabel = "Try again",
  suggestions = [
    "Check if your PDF is corrupted or password-protected",
    "Try a smaller file (under 50MB)",
    "Refresh the page and try again",
  ],
  className,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center justify-center py-16 sm:py-20 text-center", className)}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>

      {suggestions.length > 0 && (
        <ul className="mt-6 space-y-2 text-left">
          {suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              {s}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 press-scale"
          >
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </button>
        )}
        <Link
          href="/contact"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/40 press-scale"
        >
          <MessageCircle className="h-4 w-4" />
          Contact support
        </Link>
      </div>
    </motion.div>
  );
}
