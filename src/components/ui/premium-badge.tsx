"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Shield, Cloud, Zap, Cpu, FileText } from "lucide-react";

type BadgeVariant = "ai" | "browser" | "cloud" | "premium" | "fast" | "format" | "new";

const VARIANTS: Record<BadgeVariant, { icon: typeof Sparkles; label: string; colors: string }> = {
  ai: { icon: Sparkles, label: "AI-Powered", colors: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800" },
  browser: { icon: Shield, label: "Browser-Safe", colors: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800" },
  cloud: { icon: Cloud, label: "Cloud-Enhanced", colors: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800" },
  premium: { icon: Zap, label: "Premium", colors: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800" },
  fast: { icon: Zap, label: "Instant", colors: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800" },
  format: { icon: FileText, label: "", colors: "bg-muted text-muted-foreground border-border" },
  new: { icon: Sparkles, label: "New", colors: "bg-primary/10 text-primary border-primary/20" },
};

type Props = {
  variant: BadgeVariant;
  label?: string;
  className?: string;
  size?: "xs" | "sm" | "md";
};

export function ToolBadge({ variant, label, className, size = "sm" }: Props) {
  const cfg = VARIANTS[variant];
  const Icon = cfg.icon;
  const text = label ?? cfg.label;
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px] gap-0.5",
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border font-medium whitespace-nowrap", sizeClasses[size], cfg.colors, className)}>
      <Icon className={cn(size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {text && <span>{text}</span>}
    </span>
  );
}

export function FormatBadge({ formats, className }: { formats: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {formats.map((fmt) => (
        <span key={fmt} className="inline-flex items-center rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {fmt}
        </span>
      ))}
    </div>
  );
}

export function ProcessingTypeBadge({ type, className }: { type: "browser" | "cloud" | "ai"; className?: string }) {
  const configs = {
    browser: { icon: Shield, label: "Processed in your browser", color: "text-emerald-600 dark:text-emerald-400" },
    cloud: { icon: Cloud, label: "Cloud-enhanced processing", color: "text-blue-600 dark:text-blue-400" },
    ai: { icon: Cpu, label: "AI-powered analysis", color: "text-violet-600 dark:text-violet-400" },
  };
  const cfg = configs[type];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cfg.color, className)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}
