"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Cloud, Crown, LogIn, Sparkles, X } from "lucide-react";
import { Link } from "wouter";
import { useToolRightSlide } from "@/context/ToolRightSlideContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";
import { validationBody, validationTitle } from "@/lib/limits/userFacingMessages";
import { stashPremiumFlow } from "@/lib/auth/premiumFlowRestore";
import { stashAuthIntent } from "@/context/AuthPromptContext";
import { requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";
import { cn } from "@/lib/utils";
import { premiumPrice } from "@/lib/pricing/plans";

const PREMIUM_FEATURES = [
  "OCR for scanned PDFs",
  "Trusted Cloud processing",
  "No ads in workspace",
  "Larger files & documents",
  "Priority processing",
];

const PREMIUM_PLUS_FEATURES = [
  "Everything in Premium",
  "AI Summarize & Translate",
  "AI document insights",
  "Advanced table extraction",
  "Multilingual OCR",
];

export function ToolRightSlidePanel() {
  const { open, payload, closeSlide } = useToolRightSlide();
  const { requestSignIn } = useAuthPrompt();
  const { setMode } = useProcessingMode();
  const { isSignedIn } = usePremium();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSlide();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeSlide]);

  if (!payload) return null;

  const { result, toolSlug, file, settings, onContinuePremium } = payload;
  const cloudOnly = requiresCloudOnlyProcessing(toolSlug);
  const showPlans =
    result.code === "DAILY_LIMIT" ||
    result.code === "FILE_TOO_LARGE_PREMIUM" ||
    result.code === "TOO_MANY_PAGES_PREMIUM";

  const title = validationTitle(result.code);
  const body = validationBody(result.code, cloudOnly);

  const handleCloud = async () => {
    if (file) {
      await stashPremiumFlow({
        blob: file,
        fileName: file.name,
        mimeType: file.type,
        toolSlug,
        mode: "enhanced",
        settings,
      });
    }
    const returnPath =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    stashAuthIntent({
      returnPath,
      desiredMode: "enhanced",
      toolSlug,
      autoStart: true,
      deferredAction: "premium-restore",
    });
    closeSlide();
    setMode("enhanced");
    if (!isSignedIn) {
      requestSignIn({
        reason: "Sign in to continue with Trusted Cloud processing.",
        deferredAction: "premium-restore",
        toolSlug,
        autoStart: true,
      });
      return;
    }
    await onContinuePremium?.();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[82] bg-slate-950/35 backdrop-blur-[2px]"
            onClick={closeSlide}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[83] w-full max-w-[440px] overflow-y-auto border-l border-border bg-white shadow-[-12px_0_48px_-16px_rgba(15,23,42,0.2)] sm:w-[min(440px,92vw)]"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Cloud className="h-5 w-5" />
                </span>
                <p className="text-base font-bold text-foreground">{title}</p>
              </div>
              <button
                type="button"
                onClick={closeSlide}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>

              {!showPlans ? (
                <div className="space-y-2">
                  {(result.suggestSignIn || !isSignedIn) && result.suggestPremium !== false ? (
                    <button
                      type="button"
                      onClick={() => void handleCloud()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md"
                    >
                      <LogIn className="h-4 w-4" />
                      {isSignedIn ? "Continue with Trusted Cloud" : "Sign in & use Trusted Cloud"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeSlide}
                    className="flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold text-foreground hover:bg-muted/50"
                  >
                    {cloudOnly ? "Close" : "Use free browser tools instead"}
                  </button>
                </div>
              ) : null}

              {showPlans ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Choose a plan to continue
                  </p>
                  <div className="rounded-2xl border border-border bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <Crown className="h-4 w-4 text-amber-600" />
                      Premium
                    </p>
                    <p className="mt-1 text-2xl font-extrabold">
                      {premiumPrice("monthly")}
                      <span className="text-sm font-medium text-muted-foreground">/mo</span>
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {PREMIUM_FEATURES.map((f) => (
                        <li key={f} className="flex gap-2 text-xs text-muted-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/pricing"
                      onClick={closeSlide}
                      className="mt-4 flex w-full justify-center rounded-xl bg-slate-950 py-2.5 text-sm font-bold text-white"
                    >
                      Get Premium
                    </Link>
                  </div>

                  <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-50 to-white p-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
                      <Sparkles className="h-4 w-4" />
                      Premium Plus
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-foreground">
                      {premiumPrice("yearly")}
                      <span className="text-sm font-medium text-muted-foreground">/yr</span>
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {PREMIUM_PLUS_FEATURES.map((f) => (
                        <li key={f} className="flex gap-2 text-xs text-muted-foreground">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/pricing"
                      onClick={closeSlide}
                      className={cn(
                        "mt-4 flex w-full justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white",
                        "bg-gradient-to-r from-amber-500 to-amber-600",
                      )}
                    >
                      Get Premium Plus
                    </Link>
                  </div>

                  {!cloudOnly ? (
                    <button
                      type="button"
                      onClick={closeSlide}
                      className="w-full py-2 text-center text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Continue with free browser tools →
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
