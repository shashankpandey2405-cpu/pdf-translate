"use client";

import { ArrowRight, Cloud, Shield, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const BROWSER_POINTS = [
  { key: "free", defaultValue: "Free for everyday merge, split, and edit" },
  { key: "instant", defaultValue: "Instant — no server queue" },
  { key: "unlimited", defaultValue: "Unlimited browser runs on core tools" },
  { key: "local", defaultValue: "Zero upload — files stay on this device" },
] as const;

const CLOUD_POINTS = [
  { key: "quality", defaultValue: "Stronger compression, OCR, and conversions" },
  { key: "ocr", defaultValue: "Scanned documents → searchable text" },
  { key: "large", defaultValue: "Large PDFs without browser memory crashes" },
  { key: "secure", defaultValue: "HTTPS · encrypted workers · auto-purge" },
] as const;

export function HomeBrowserVsCloud() {
  const { t } = useTranslation();

  return (
    <SaasSection muted id="processing-modes" className="home-section-cv">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {t("home.modes.eyebrow", { defaultValue: "Smart hybrid processing" })}
        </p>
        <h2 className="saas-heading mt-2">
          {t("home.modes.title", { defaultValue: "Private Local or Turbo Cloud — you choose" })}
        </h2>
        <p className="saas-subheading mx-auto">
          {t("home.modes.subtitle", {
            defaultValue:
              "Lightweight tasks stay in your browser. Large files, OCR, AI, and advanced conversions use secure Turbo Cloud with auto-delete staging.",
          })}
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="saas-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
              <Shield className="h-5 w-5 text-foreground" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {t("execution.browserTitle", { defaultValue: "Browser Processing" })}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                {t("home.modes.browserTag", { defaultValue: "Free · Unlimited" })}
              </p>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            {BROWSER_POINTS.map(({ key, defaultValue }) => (
              <li key={key} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`home.modes.browser.${key}`, { defaultValue })}
              </li>
            ))}
          </ul>
        </div>

        <div className="saas-card relative overflow-hidden border-primary/30 p-6 sm:p-8 ring-1 ring-primary/15">
          <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            {t("home.modes.recommended", { defaultValue: "For heavy work" })}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Cloud className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {t("execution.cloudTitle", { defaultValue: "Cloud Processing" })}
              </h3>
              <p className="text-xs font-medium text-primary">
                {t("home.modes.cloudTag", { defaultValue: "Premium · Higher quality" })}
              </p>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            {CLOUD_POINTS.map(({ key, defaultValue }) => (
              <li key={key} className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                {t(`home.modes.cloud.${key}`, { defaultValue })}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
        <Link
          href="/pricing"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 touch-manipulation"
        >
          {t("home.modes.viewPlans", { defaultValue: "View plans" })}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="max-w-md text-xs text-muted-foreground">
          {t("home.modes.pricingNote", {
            defaultValue: "Premium unlocks higher cloud limits, AI tools, and stronger compression options.",
          })}
        </p>
      </div>
    </SaasSection>
  );
}
