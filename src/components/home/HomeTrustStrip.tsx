"use client";

import { Lock, Shield, Trash2, Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const TRUST_ITEMS = [
  { icon: Cpu, key: "local", default: "Local processing" },
  { icon: Trash2, key: "autoDelete", default: "Auto-delete files" },
  { icon: Lock, key: "ssl", default: "SSL encrypted" },
  { icon: Shield, key: "privacy", default: "Privacy-first" },
] as const;

export function HomeTrustStrip() {
  const { t } = useTranslation();

  return (
    <SaasSection id="trust" className="py-8 sm:py-12">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        {t("home.trustStrip.eyebrow", { defaultValue: "Trust" })}
      </p>
      <h2 className="mt-2 text-center text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {t("home.trustStrip.title", { defaultValue: "Your files stay yours" })}
      </h2>
      <ul className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {TRUST_ITEMS.map(({ icon: Icon, key, default: fallback }) => (
          <li
            key={key}
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/60 bg-white/80 px-3 py-4 text-center shadow-sm dark:border-slate-700/50 dark:bg-slate-900/60"
          >
            <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t(`home.trustStrip.${key}`, { defaultValue: fallback })}
            </span>
          </li>
        ))}
      </ul>
    </SaasSection>
  );
}
