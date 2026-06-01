"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import {
  acceptAllConsent,
  isLikelyCcpaRegion,
  readConsentState,
  rejectNonEssentialConsent,
  saveCustomConsent,
  subscribeConsent,
} from "@/lib/consent";
import { isAdsenseEnabled } from "@/lib/adsense";
import { useOverlaySlot } from "@/context/OverlayPriorityContext";

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const [wantsOpen, setWantsOpen] = useState(false);
  const { visible: slotVisible } = useOverlaySlot("cookieConsent", wantsOpen);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [preferences, setPreferences] = useState(true);

  const gaConfigured = Boolean(
    (process.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() ||
      (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string | undefined)?.trim(),
  );
  const monetizationActive = isAdsenseEnabled() || gaConfigured;

  const refresh = useCallback(() => {
    const state = readConsentState();
    if (!state) {
      setWantsOpen(true);
      return;
    }
    setWantsOpen(false);
    setAnalytics(state.analytics);
    setAdvertising(state.advertising);
    setPreferences(state.preferences);
  }, []);

  useEffect(() => {
    if (!monetizationActive) return;
    refresh();
    return subscribeConsent(refresh);
  }, [monetizationActive, refresh]);

  if (!slotVisible || !monetizationActive) return null;

  const ccpa = isLikelyCcpaRegion();

  return (
    <div
      role="dialog"
      aria-label={t("consent.title")}
      className="pointer-events-auto fixed z-[60] mx-auto max-w-xl rounded-2xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-md sm:p-5 lg:bottom-6 left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(5.25rem+env(safe-area-inset-bottom))] lg:left-4 lg:right-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings2 className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("consent.title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("consent.body")}</p>
          {ccpa ? (
            <p className="mt-2 text-[11px] text-muted-foreground">{t("consent.ccpaNotice")}</p>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
          <ConsentToggle
            label={t("consent.essentialLabel")}
            description={t("consent.essentialDesc")}
            checked
            disabled
          />
          <ConsentToggle
            label={t("consent.analyticsLabel")}
            description={t("consent.analyticsDesc")}
            checked={analytics}
            onChange={setAnalytics}
          />
          <ConsentToggle
            label={t("consent.advertisingLabel")}
            description={t("consent.advertisingDesc")}
            checked={advertising}
            onChange={setAdvertising}
          />
          <ConsentToggle
            label={t("consent.preferencesLabel")}
            description={t("consent.preferencesDesc")}
            checked={preferences}
            onChange={setPreferences}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            acceptAllConsent();
            setWantsOpen(false);
          }}
        >
          {t("consent.acceptAll")}
        </button>
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          onClick={() => {
            rejectNonEssentialConsent();
            setWantsOpen(false);
          }}
        >
          {t("consent.rejectOptional")}
        </button>
        {expanded ? (
          <button
            type="button"
            className="rounded-xl border border-primary/30 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
            onClick={() => {
              saveCustomConsent({ analytics, advertising, preferences });
              setWantsOpen(false);
            }}
          >
            {t("consent.saveChoices")}
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(true)}
          >
            {t("consent.manage")}
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
        {expanded ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(false)}
          >
            {t("consent.collapse")}
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        <Link href="/cookie-policy" className="font-medium text-primary hover:underline">
          {t("layout.cookieLink")}
        </Link>
        {" · "}
        <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
          {t("layout.privacyLink")}
        </Link>
      </p>
    </div>
  );
}

function ConsentToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
    </label>
  );
}

/** Re-open preferences from footer (exported for modal trigger). */
export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("pdftrusted:consent-v1");
    window.dispatchEvent(new Event("pdftrusted:consent-changed"));
  } catch {
    /* ignore */
  }
}
