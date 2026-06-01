"use client";

import { Download, Settings2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const STEPS = [
  { icon: Upload, key: "upload" },
  { icon: Settings2, key: "process" },
  { icon: Download, key: "download" },
] as const;

export function HomeHowItWorks() {
  const { t } = useTranslation();

  return (
    <SaasSection id="how-it-works" className="home-section-cv">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        {t("home.how.eyebrow", { defaultValue: "How it works" })}
      </p>
      <h2 className="saas-heading mt-2">
        {t("home.how.title", { defaultValue: "Three steps, no clutter" })}
      </h2>
      <p className="saas-subheading">
        {t("home.how.subtitle", {
          defaultValue: "Pick a tool, upload your file, download the result. Most browser tools never upload your PDF.",
        })}
      </p>
      <ol className="mt-10 grid gap-6 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, key }, idx) => (
          <li key={key} className="saas-card relative p-6">
            <span className="absolute right-4 top-4 text-3xl font-black text-primary/15">{idx + 1}</span>
            <Icon className="h-7 w-7 text-primary" aria-hidden />
            <h3 className="mt-4 text-sm font-bold text-foreground">
              {t(`home.how.steps.${key}.title`, { defaultValue: key })}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t(`home.how.steps.${key}.desc`, { defaultValue: "" })}
            </p>
          </li>
        ))}
      </ol>
    </SaasSection>
  );
}
