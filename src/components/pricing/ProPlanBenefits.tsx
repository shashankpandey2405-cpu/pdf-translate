"use client";

import { useState } from "react";
import { Link } from "wouter";
import {
  Brain,
  Minimize2,
  ScanLine,
  Sparkles,
  Layers,
  Shield,
  Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { icon: Brain, key: "ai", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { icon: Minimize2, key: "compress", color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
  { icon: ScanLine, key: "ocr", color: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" },
  { icon: Sparkles, key: "adfree", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { icon: Layers, key: "bulk", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  { icon: Shield, key: "privacy", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
] as const;

export function ProPlanBenefits() {
  const { t } = useTranslation();
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {BENEFITS.map(({ icon: Icon, key, color }) => (
          <div
            key={key}
            className="group flex gap-4 rounded-xl border border-transparent p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", color)}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-start gap-2 font-bold text-slate-900 dark:text-white">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 transition-transform group-hover:scale-110" aria-hidden />
                {t(`pricingPage.proBenefits.${key}.title`)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t(`pricingPage.proBenefits.${key}.desc`)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-slate-200/80 pt-6 dark:border-slate-800 sm:flex-row sm:justify-between">
        <span className="rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {t("pricingPage.proBenefits.trustedBadge", {
            defaultValue: "Trusted by 50,000+ Professionals & AI Researchers",
          })}
        </span>
        <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="text-sm font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
            >
              {t("pricingPage.proBenefits.compareAdobe", { defaultValue: "Compare to Adobe →" })}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("pricingPage.compareTitle", { defaultValue: "PDFTrusted vs Adobe" })}</DialogTitle>
            </DialogHeader>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ {t("pricingPage.valueGap.point1")}</li>
              <li>✓ {t("pricingPage.valueGap.point2")}</li>
              <li>✓ {t("pricingPage.valueGap.point3")}</li>
            </ul>
            <Link
              href="/compare/adobe-acrobat"
              onClick={() => setCompareOpen(false)}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
            >
              {t("pricingPage.proBenefits.fullCompare", { defaultValue: "Full comparison" })}
            </Link>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
