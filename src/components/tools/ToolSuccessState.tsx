"use client";

import { motion } from "framer-motion";
import { Download, ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { AnimatedCheckmark } from "@/components/ui/premium-animations";

type NextAction = {
  label: string;
  href: string;
};

type Props = {
  title?: string;
  subtitle?: string;
  downloadUrl?: string;
  downloadLabel?: string;
  onReset?: () => void;
  resetLabel?: string;
  nextActions?: NextAction[];
  className?: string;
};

export function ToolSuccessState({
  title = "Processing complete!",
  subtitle = "Your file is ready to download.",
  downloadUrl,
  downloadLabel = "Download result",
  onReset,
  resetLabel = "Process another file",
  nextActions = [],
  className,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center justify-center py-16 sm:py-20 text-center", className)}
    >
      <AnimatedCheckmark size={64} />

      <h2 className="mt-6 text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 press-scale"
          >
            <Download className="h-4 w-4" />
            {downloadLabel}
          </a>
        )}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary/40 press-scale"
          >
            <RefreshCw className="h-4 w-4" />
            {resetLabel}
          </button>
        )}
      </div>

      {nextActions.length > 0 && (
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            What's next?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {nextActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                {action.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
