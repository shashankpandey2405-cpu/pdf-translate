"use client";

import { Link } from "wouter";
import {
  Crown,
  Zap,
  Infinity,
  HeadphonesIcon,
  FileUp,
  Brain,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const FREE_FEATURES = [
  "30+ PDF tools — free forever",
  "Compress, merge, split, convert",
  "Browser-first privacy",
  "No sign-up required",
  "5 AI credits daily",
];

const PREMIUM_FEATURES = [
  { icon: Infinity, text: "Unlimited AI processing" },
  { icon: FileUp, text: "Files up to 500MB" },
  { icon: Brain, text: "GPT-4 & Claude Pro models" },
  { icon: Zap, text: "Priority cloud processing" },
  { icon: ShieldCheck, text: "Enterprise-grade security" },
  { icon: HeadphonesIcon, text: "Priority support" },
];

export function HomePremiumShowcase() {
  const { t } = useTranslation();

  return (
    <SaasSection id="premium">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30 dark:text-amber-300">
          <Crown className="h-3.5 w-3.5" />
          Premium Plans
        </span>
        <h2 className="saas-heading mt-4">
          Free Forever. Premium When You Need More.
        </h2>
        <p className="saas-subheading mx-auto">
          Start with powerful free tools. Upgrade for unlimited AI, larger files, and priority processing.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
        <div className="relative rounded-2xl border border-border bg-card p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground">
            Free Forever
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black text-foreground">$0</span>
            <span className="ml-1 text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Full access to all basic PDF tools, no account needed.
          </p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/all-tools"
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted text-sm font-bold text-foreground transition-colors hover:bg-muted/80 press-scale"
          >
            Get Started Free
          </Link>
        </div>

        <div className="relative rounded-2xl border-2 border-primary bg-gradient-to-b from-primary/5 to-card p-8 shadow-xl shadow-primary/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30">
              <Star className="h-3 w-3 fill-current" />
              MOST POPULAR
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 text-xs font-bold text-amber-800 dark:from-amber-950/50 dark:to-orange-950/50 dark:text-amber-300">
            <Crown className="h-3 w-3" />
            Premium
          </div>
          <div className="mt-4">
            <span className="text-4xl font-black text-foreground">$9.99</span>
            <span className="ml-1 text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Unlimited AI power, larger files, and priority processing.
          </p>
          <ul className="mt-6 space-y-3">
            {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                {text}
              </li>
            ))}
          </ul>
          <Link
            href="/pricing"
            className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:brightness-110 press-scale"
          >
            Start Premium Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            7-day free trial. Cancel anytime. No credit card required.
          </p>
        </div>
      </div>
    </SaasSection>
  );
}
