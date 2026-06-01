"use client";

import { Gauge, Brain, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SaasSection } from "@/components/saas/SaasSection";
import { staggerContainer, staggerItem } from "@/components/premium/motion";

const POWER_FEATURES = [
  {
    icon: Gauge,
    gradient: "from-emerald-500 to-teal-600",
    titleKey: "home.power.compression.title",
    titleDefault: "AI PDF Compression Engine",
    descKey: "home.power.compression.desc",
    descDefault:
      "Reduce file size by up to 90% while preserving readability and structure. Our AI analyzes each page element individually for optimal compression.",
  },
  {
    icon: Brain,
    gradient: "from-blue-500 to-indigo-600",
    titleKey: "home.power.intelligence.title",
    titleDefault: "AI Document Intelligence",
    descKey: "home.power.intelligence.desc",
    descDefault:
      "Turn any PDF into searchable, interactive knowledge. Chat, summarize, extract data, and translate documents with advanced AI models.",
  },
  {
    icon: Globe,
    gradient: "from-amber-500 to-orange-600",
    titleKey: "home.power.cloud.title",
    titleDefault: "Global Cloud Processing",
    descKey: "home.power.cloud.desc",
    descDefault:
      "Fast, secure processing from servers optimized for USA, UAE & Asia. Auto-scaling infrastructure delivers results in seconds worldwide.",
  },
] as const;

export function HomePowerFeatures() {
  const { t } = useTranslation();

  return (
    <SaasSection muted id="power-features">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
          {t("home.power.eyebrow", { defaultValue: "Power Features" })}
        </span>
        <h2 className="saas-heading mt-4">
          {t("home.power.title", { defaultValue: "Built for speed, scale, and intelligence" })}
        </h2>
      </div>

      <motion.div
        className="mt-10 grid gap-6 sm:grid-cols-3"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-50px" }}
      >
        {POWER_FEATURES.map(({ icon: Icon, gradient, titleKey, titleDefault, descKey, descDefault }) => (
          <motion.article
            key={titleKey}
            variants={staggerItem}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">
              {t(titleKey, { defaultValue: titleDefault })}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(descKey, { defaultValue: descDefault })}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </SaasSection>
  );
}
