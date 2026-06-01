"use client";

import { Lock, Server, ShieldCheck, Timer } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const ITEMS = [
  { icon: ShieldCheck, key: "private" },
  { icon: Lock, key: "encrypted" },
  { icon: Timer, key: "retention" },
  { icon: Server, key: "control" },
] as const;

export function HomeSecurity() {
  const { t } = useTranslation();

  return (
    <SaasSection muted id="security" className="home-section-cv">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t("home.security.eyebrow", { defaultValue: "Security & privacy" })}
          </p>
          <h2 className="saas-heading mt-2">
            {t("home.security.title", { defaultValue: "Trusted by design" })}
          </h2>
          <p className="saas-subheading">
            {t("home.security.subtitle", {
              defaultValue:
                "Browser mode keeps files on your device. Cloud mode uses encrypted transfer and automatic deletion.",
            })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/privacy-center"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:border-primary/40"
            >
              {t("footer.privacyCenter", { defaultValue: "Privacy Center" })}
            </Link>
            <Link
              href="/security"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("footer.securityPage", { defaultValue: "Security" })}
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ITEMS.map(({ icon: Icon, key }) => (
            <div key={key} className="saas-card p-5">
              <Icon className="h-6 w-6 text-primary mb-3" aria-hidden />
              <h3 className="text-sm font-bold text-foreground">
                {t(`home.security.items.${key}.title`, { defaultValue: key })}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {t(`home.security.items.${key}.desc`, { defaultValue: "" })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SaasSection>
  );
}
