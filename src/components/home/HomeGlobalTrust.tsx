"use client";

import { Globe, Cloud, ShieldCheck, Zap, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";

const PILLARS = [
  {
    icon: Globe,
    color: "from-blue-500 to-indigo-600",
    title: "Global CDN Infrastructure",
    desc: "Edge servers optimized across US, Europe, Middle East, India, and Southeast Asia for sub-second response times worldwide.",
  },
  {
    icon: Cloud,
    color: "from-violet-500 to-purple-600",
    title: "Auto-Scaling Cloud AI",
    desc: "Heavy AI workloads run on dedicated infrastructure with auto-scaling. Fast results for large and complex documents.",
  },
  {
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-600",
    title: "Privacy & security by design",
    desc: "Encrypted transfers, automatic cloud cleanup, consent controls, and policies designed with major privacy frameworks in mind—not sold for ads or AI training.",
  },
  {
    icon: Zap,
    color: "from-amber-500 to-orange-600",
    title: "Optimized AI Inference",
    desc: "Smart model routing selects the fastest pipeline for each task. Small files in 2 seconds, complex documents in 30.",
  },
] as const;

const REGIONS = [
  { name: "United States", flag: "🇺🇸" },
  { name: "India", flag: "🇮🇳" },
  { name: "UAE", flag: "🇦🇪" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
];

export function HomeGlobalTrust() {
  const { t } = useTranslation();

  return (
    <SaasSection muted id="global-trust">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          <Globe className="h-3.5 w-3.5" />
          Global Platform
        </span>
        <h2 className="saas-heading mt-4">
          {t("home.global.title", { defaultValue: "Trusted by Users Across Every Continent" })}
        </h2>
        <p className="saas-subheading mx-auto">
          {t("home.global.subtitle", {
            defaultValue: "Used by professionals, students, and businesses in 100+ countries with optimized infrastructure in every region.",
          })}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {REGIONS.map(({ name, flag }) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <span className="text-base leading-none">{flag}</span>
            {name}
          </span>
        ))}
        <span className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="mr-1 inline h-3 w-3" />
          90+ more countries
        </span>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map(({ icon: Icon, color, title, desc }) => (
          <div
            key={title}
            className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md transition-transform group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </SaasSection>
  );
}
