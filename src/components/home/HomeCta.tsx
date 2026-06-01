"use client";

import { ArrowRight, Sparkles, Crown, Zap, Shield, Globe } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export function HomeCta() {
  const { t } = useTranslation();

  return (
    <section aria-label="Call to action" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -top-20 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Ready to transform your PDF workflow?
          </span>

          <h2 className="mt-6 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Start Using{" "}
            <span className="bg-gradient-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent">
              AI PDF Tools
            </span>
            {" "}Today
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("home.cta.subtitle", {
              defaultValue: "Join thousands of professionals worldwide. No setup, no installation, no sign-up required.",
            })}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/all-tools"
              className="inline-flex h-13 items-center gap-2 rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:brightness-110 press-scale"
            >
              Explore All Tools — Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-13 items-center gap-2 rounded-xl border-2 border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-3 text-base font-bold text-amber-800 shadow-md transition-all hover:shadow-lg dark:from-amber-950/30 dark:to-orange-950/30 dark:text-amber-300 dark:border-amber-700/60 press-scale"
            >
              <Crown className="h-5 w-5 text-amber-500" />
              Try Premium Free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted press-scale sm:col-span-2"
            >
              Sign in for cloud history
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Zap, label: "2s Processing" },
              { icon: Shield, label: "Privacy-first" },
              { icon: Sparkles, label: "AI Powered" },
              { icon: Globe, label: "100+ Countries" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <Icon className="h-5 w-5 text-primary/70" />
                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
