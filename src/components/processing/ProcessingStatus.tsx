"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingStatusType } from "@/lib/processing/processingStatusType";

const AI_SUBTITLES = [
  "Analyzing structure…",
  "Applying Neural Models…",
  "Finalizing insights…",
] as const;

export type ProcessingStatusProps = {
  type: ProcessingStatusType;
  /** 0–100 for cloud + instant completion threshold */
  progress?: number;
  label?: string;
  className?: string;
  /** When true, instant state plays success checkmark */
  complete?: boolean;
};

function NeuralAiState({ label }: { label?: string }) {
  const [subtitleIdx, setSubtitleIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSubtitleIdx((i) => (i + 1) % AI_SUBTITLES.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-6" role="status" aria-live="polite">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span
          className="absolute h-[88px] w-[88px] animate-spin-slow rounded-full border border-indigo-400/30"
          aria-hidden
        />
        <span
          className="absolute h-[72px] w-[72px] animate-spin-slow rounded-full border border-dashed border-violet-400/40"
          style={{ animationDirection: "reverse", animationDuration: "6s" }}
          aria-hidden
        />
        <span
          className="absolute h-[56px] w-[56px] animate-spin-slow rounded-full border border-primary/25"
          style={{ animationDuration: "10s" }}
          aria-hidden
        />
        <span
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-[0_0_28px_rgba(79,70,229,0.55)] animate-pulse"
          aria-hidden
        >
          <span className="text-lg text-white">✨</span>
        </span>
      </div>
      <div className="max-w-xs text-center">
        <p className="text-sm font-semibold text-foreground sm:text-base">
          {label ?? "Neural AI processing…"}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={subtitleIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="mt-1 text-xs text-muted-foreground"
          >
            {AI_SUBTITLES[subtitleIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function CloudFastState({ progress = 0, label }: { progress?: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 py-6" role="status" aria-live="polite">
      <p className="text-sm font-semibold text-foreground">{label ?? "Cloud processing…"}</p>
      <div className="flex w-full items-center gap-3">
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
          <span className="processing-bar-shimmer pointer-events-none absolute inset-0" aria-hidden />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-sm font-bold tabular-nums text-primary">
          {pct}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Secure cloud pipeline · auto cleanup</p>
    </div>
  );
}

function InstantState({ complete, label }: { complete?: boolean; label?: string }) {
  const [done, setDone] = useState(Boolean(complete));

  useEffect(() => {
    if (complete) {
      setDone(true);
      return;
    }
    const id = window.setTimeout(() => setDone(true), 1000);
    return () => window.clearTimeout(id);
  }, [complete]);

  return (
    <div className="flex flex-col items-center gap-4 py-6" role="status" aria-live="polite">
      <div className="relative flex h-20 w-16 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card/80">
        <FileText className="h-9 w-9 text-primary/80" aria-hidden />
        {!done ? (
          <span className="processing-scanline pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-indigo-400/35 to-transparent" />
        ) : null}
        <AnimatePresence>
          {done ? (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 24 }}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      <p className="text-xs font-semibold text-foreground sm:text-sm">
        {done ? "Done — ready in a blink" : (label ?? "Optimizing locally…")}
      </p>
    </div>
  );
}

/** Premium processing animation — AI neural, cloud progress, or instant scanline. */
export function ProcessingStatus({ type, progress, label, className, complete }: ProcessingStatusProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className={cn("flex w-full min-w-0 max-w-full items-center justify-center px-4", className)}
      >
        {type === "ai" ? <NeuralAiState label={label} /> : null}
        {type === "cloud" ? <CloudFastState progress={progress} label={label} /> : null}
        {type === "instant" ? <InstantState complete={complete} label={label} /> : null}
      </motion.div>
    </AnimatePresence>
  );
}
