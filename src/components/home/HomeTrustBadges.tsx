"use client";

import { Lock, Trash2, Zap, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const BADGES = [
  { icon: Lock, key: "secure", default: "Secure SSL" },
  { icon: Trash2, key: "autoDelete", default: "Auto-delete files" },
  { icon: Zap, key: "fast", default: "Fast processing" },
  { icon: Sparkles, key: "ai", default: "AI-powered" },
  { icon: Lock, key: "noSignup", default: "No signup to start" },
] as const;

export function HomeTrustBadges() {
  const { t } = useTranslation();

  return (
    <div className="saas-section py-6 sm:py-8">
      <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {BADGES.map(({ icon: Icon, key, default: fallback }) => (
          <li
            key={key}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden />
            {t(`home.trust.${key}`, { defaultValue: fallback })}
          </li>
        ))}
      </ul>
    </div>
  );
}
