"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { FileUp, X } from "lucide-react";
import { usePremium } from "@/context/PremiumContext";
import { isExitIntentSuppressed } from "@/lib/overlayGate";
import { cn } from "@/lib/utils";

const DISMISS_SESSION_KEY = "pdftrusted-idle-nudge-dismissed";
const MIN_MS_TOOL = 28_000;
const MIN_MS_HOME = 40_000;

const TOOL_SLUGS = new Set([
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
  "rotate-pdf",
  "pdf-to-jpg",
  "jpg-to-pdf",
  "ocr-pdf",
  "translate-pdf",
]);

function parseToolSlug(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  const slug = parts[parts.length - 1];
  if (slug && TOOL_SLUGS.has(slug)) return slug;
  return null;
}

function isHomePath(path: string): boolean {
  const trimmed = path.replace(/\/$/, "");
  return trimmed === "" || /^\/[a-z]{2}$/.test(trimmed);
}

/**
 * Mobile-friendly dwell nudge for guests on high-intent routes (no exit mouse required).
 */
export function GuestIdleToolNudge() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { isSignedIn } = usePremium();
  const [visible, setVisible] = useState(false);

  const toolSlug = useMemo(() => parseToolSlug(location), [location]);
  const onHome = useMemo(() => isHomePath(location), [location]);
  const eligibleRoute = toolSlug !== null || onHome;

  const ctaHref = toolSlug ? `/${toolSlug}` : "/merge-pdf";

  useEffect(() => {
    if (isSignedIn || !eligibleRoute) {
      setVisible(false);
      return;
    }
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(DISMISS_SESSION_KEY) === "1") return;
    if (isExitIntentSuppressed()) return;

    const delay = toolSlug ? MIN_MS_TOOL : MIN_MS_HOME;
    const tmr = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(tmr);
  }, [isSignedIn, eligibleRoute, toolSlug, location]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
    } catch {}
  }, []);

  if (!visible || isSignedIn) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[60] px-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] lg:hidden",
        "pointer-events-none",
      )}
      role="region"
      aria-label={t("conversion.idleNudge.title", { defaultValue: "Try a free PDF tool" })}
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileUp className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {t("conversion.idleNudge.title", { defaultValue: "Try 1 free conversion" })}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {t("conversion.idleNudge.body", {
              defaultValue: "Drop a PDF — no signup, runs in your browser.",
            })}
          </p>
          <Link
            href={ctaHref}
            onClick={dismiss}
            className="mt-2 inline-flex min-h-[40px] items-center rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            {toolSlug
              ? t("conversion.idleNudge.ctaTool", { defaultValue: "Upload & start" })
              : t("conversion.idleNudge.ctaHome", { defaultValue: "Try merge PDF free" })}
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
          aria-label={t("conversion.idleNudge.dismiss", { defaultValue: "Dismiss" })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
