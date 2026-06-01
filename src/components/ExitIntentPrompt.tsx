import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isExitIntentSuppressed } from "@/lib/overlayGate";
import { usePremium } from "@/context/PremiumContext";
import { signInWithGoogle } from "@/lib/authClient";
import { logConversionEvent } from "@/utils/logger";

const DISMISS_UNTIL_KEY = "pdftrusted-exit-dismiss-until";
const SHOWN_SESSION_KEY = "pdftrusted-exit-shown-session";
const MIN_MS_DEFAULT = 45_000;
const MIN_MS_TOOL = 22_000;

const HIGH_INTENT_TOOLS = new Set([
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
  "ocr-pdf",
  "translate-pdf",
  "chat-pdf",
  "ai-summarize",
]);

function readDismissUntil(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DISMISS_UNTIL_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function markDismissedLong(days: number) {
  if (typeof window === "undefined") return;
  const until = Date.now() + days * 864e5;
  window.localStorage.setItem(DISMISS_UNTIL_KEY, String(until));
  window.sessionStorage.setItem(SHOWN_SESSION_KEY, "1");
}

function markShownThisSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SHOWN_SESSION_KEY, "1");
}

function hasShownThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SHOWN_SESSION_KEY) === "1";
}

/**
 * Desktop-oriented exit capture (mouse leaving toward the top chrome) after a dwell period.
 * Suppressed while the PWA install modal is open.
 */
function isFocusedToolRoute(location: string): boolean {
  return (
    location.includes("/pdf-editor") ||
    location.includes("/sign-pdf") ||
    location.includes("/resume-builder")
  );
}

function toolSlugFromPath(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  const slug = parts[parts.length - 1];
  return slug && HIGH_INTENT_TOOLS.has(slug) ? slug : null;
}

export function ExitIntentPrompt() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { isSignedIn } = usePremium();
  const [open, setOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const eligibleRef = useRef(false);
  const disabled = isFocusedToolRoute(location);

  const toolSlug = useMemo(() => toolSlugFromPath(location), [location]);
  const dwellMs = toolSlug ? MIN_MS_TOOL : MIN_MS_DEFAULT;
  const tryToolHref = toolSlug ? `/${toolSlug}` : "/merge-pdf";

  useEffect(() => {
    eligibleRef.current = false;
    const tmr = window.setTimeout(() => {
      eligibleRef.current = true;
    }, dwellMs);
    return () => window.clearTimeout(tmr);
  }, [dwellMs, location]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(window.location.pathname);
    } catch {
      setGoogleLoading(false);
    }
  };

  const tryOpen = useCallback(() => {
    if (disabled) return;
    if (!eligibleRef.current) return;
    if (isExitIntentSuppressed()) return;
    const dismissUntil = readDismissUntil();
    if (dismissUntil && Date.now() < dismissUntil) return;
    if (hasShownThisSession()) return;
    markShownThisSession();
    logConversionEvent("exit_intent_shown", { tool_slug: toolSlug ?? undefined });
    setOpen(true);
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;
    if (typeof document === "undefined") return;
    const onMouseOut = (e: MouseEvent) => {
      if (!eligibleRef.current || isExitIntentSuppressed()) return;
      const rel = e.relatedTarget as Node | null;
      if (rel && rel.nodeType) return;
      if (e.clientY > 32) return;
      tryOpen();
    };
    document.documentElement.addEventListener("mouseout", onMouseOut);
    return () => document.documentElement.removeEventListener("mouseout", onMouseOut);
  }, [tryOpen, disabled]);

  const dismissForAWhile = useCallback(() => {
    setOpen(false);
    markDismissedLong(7);
  }, []);

  if (disabled || isSignedIn) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-3xl border border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("conversion.exitIntent.title", { defaultValue: "Wait — try 1 free PDF first" })}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {t("conversion.exitIntent.body", {
              defaultValue:
                "Merge, compress, and split run in your browser — no account needed. Turbo Cloud & AI unlock with 10 free credits/month.",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Link
            href={tryToolHref}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => setOpen(false)}
          >
            {toolSlug
              ? t("conversion.exitIntent.ctaTool", { defaultValue: "Continue on this tool — free" })
              : t("conversion.exitIntent.ctaMerge", { defaultValue: "Try merge PDF — no signup" })}
          </Link>
          <button
            type="button"
            disabled={googleLoading}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/8 px-4 py-3 text-sm font-semibold text-foreground hover:bg-indigo-500/12 disabled:opacity-60"
            onClick={() => void handleGoogle()}
          >
            {googleLoading ? (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : null}
            {t("conversion.exitIntent.ctaGoogle", {
              defaultValue: "Continue with Google — 10 credits/month",
            })}
          </button>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
            onClick={dismissForAWhile}
          >
            {t("conversion.exitIntent.dismiss", { defaultValue: "Not now" })}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
