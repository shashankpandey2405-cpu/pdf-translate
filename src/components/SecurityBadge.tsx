"use client";

import { useTranslation } from "react-i18next";

export default function SecurityBadge() {
  const { t } = useTranslation();
  return (
    <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-green-600/20 bg-green-600/5 px-4 py-3 text-sm text-green-900 shadow-sm shadow-green-500/10 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-50">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-600/10 text-green-700 dark:bg-green-500/20 dark:text-green-200">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
      <div>
        <p className="font-semibold">{t("securityBadge.title")}</p>
        <p className="text-xs text-green-900/75 dark:text-green-100/80">{t("securityBadge.description")}</p>
      </div>
    </div>
  );
}
