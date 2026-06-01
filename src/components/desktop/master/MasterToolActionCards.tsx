"use client";

import { Cloud, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/desktop/GlassPanel";
import { cn } from "@/lib/utils";

type FreeCardProps = {
  title?: string;
  description: string;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
};

export function MasterToolFreeCard({
  title = "Standard",
  description,
  actionLabel,
  disabled,
  onAction,
}: FreeCardProps) {
  return (
    <GlassPanel className="p-5" variant="elevated">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          Free
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-white py-3 text-sm font-bold transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
      >
        <Zap className="h-4 w-4 text-amber-600" />
        {actionLabel}
      </button>
    </GlassPanel>
  );
}

type PremiumCardProps = {
  title?: string;
  features: string[];
  actionLabel: string;
  disabled?: boolean;
  isSignedIn: boolean;
  onAction: () => void;
};

export function MasterToolPremiumCard({
  title = "AI + Cloud",
  features,
  actionLabel,
  disabled,
  isSignedIn,
  onAction,
}: PremiumCardProps) {
  return (
    <GlassPanel
      className={cn(
        "relative overflow-hidden p-5 ring-2 ring-primary/25",
        "bg-gradient-to-br from-primary/8 via-white to-blue-500/5",
      )}
      variant="elevated"
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <span className="rounded-full bg-slate-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Premium
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
        <button
          type="button"
          disabled={disabled}
          onClick={onAction}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-900 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 text-blue-300" />
          {isSignedIn ? actionLabel : "Sign in for Premium"}
        </button>
        {!isSignedIn ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Login required for cloud AI pipeline</p>
        ) : null}
      </div>
    </GlassPanel>
  );
}

type ProgressCardProps = {
  progress: number;
  label?: string;
};

export function MasterToolProgressCard({ progress, label = "Processing" }: ProgressCardProps) {
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Cloud className="h-4 w-4 animate-pulse text-primary" />
        {label} {Math.round(progress)}%
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>
    </GlassPanel>
  );
}
