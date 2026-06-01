"use client";

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const AI_ACTIONS = [
  { key: "summary", href: "/ai-summarize", label: "Summary" },
  { key: "chat", href: "/chat-pdf", label: "Chat" },
  { key: "ocr", href: "/ocr-pdf", label: "OCR" },
  { key: "translate", href: "/translate-pdf", label: "Translate" },
] as const;

export function AIDashboard() {
  const { t } = useTranslation();

  return (
    <section
      className="flex flex-col gap-4 px-[max(1rem,env(safe-area-inset-left))] py-4 pr-[max(1rem,env(safe-area-inset-right))] lg:hidden"
      aria-label={t("home.aiDashboard.label", { defaultValue: "AI quick actions" })}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-[10px] font-bold uppercase text-primary">
            {t("home.aiDashboard.credits", { defaultValue: "AI Credits" })}
          </p>
          <p className="text-xl font-extrabold text-foreground">
            {t("home.aiDashboard.creditsValue", { defaultValue: "Try free" })}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
            {t("home.aiDashboard.privacy", { defaultValue: "Privacy" })}
          </p>
          <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100">
            {t("home.aiDashboard.privacyValue", { defaultValue: "Local ✨" })}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">
          {t("home.aiDashboard.fastActions", { defaultValue: "Fast AI Actions" })}
        </h2>
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 touch-pan-x">
          {AI_ACTIONS.map(({ key, href, label }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                "press-scale flex min-h-[88px] min-w-[100px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 transition-transform active:scale-95",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
