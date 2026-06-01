"use client";

import { motion } from "framer-motion";
import { Check, Shield, Cpu, Trash2, Eye } from "lucide-react";
import { Link } from "wouter";
import ToolSEO from "@/components/ToolSEO";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { useTranslation } from "react-i18next";
import { fadeUp, fadeUpTransition } from "@/components/premium/motion";

const PILLARS = [
  { key: "local", icon: Cpu },
  { key: "noUpload", icon: Shield },
  { key: "browser", icon: Eye },
  { key: "cleanup", icon: Trash2 },
] as const;

export default function PrivacyCenter() {
  const { t, i18n } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <ToolSEO
        title={t("privacyCenter.seoTitle")}
        description={t("privacyCenter.seoDesc")}
        slug="privacy-center"
        lang={i18n.language}
      />
      <motion.div {...fadeUp} transition={fadeUpTransition}>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{t("privacyCenter.title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{t("privacyCenter.intro")}</p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PILLARS.map(({ key, icon: Icon }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassPanel className="p-5 h-full">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-5 w-5" />
                </span>
                <div>
                  <Icon className="h-4 w-4 text-primary mb-2" />
                  <h2 className="font-bold text-foreground">{t(`privacyCenter.pillars.${key}.title`)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`privacyCenter.pillars.${key}.desc`)}</p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <div id="data-retention" className="scroll-mt-24">
        <GlassPanel className="mt-10 p-6 space-y-3">
          <h2 className="text-lg font-bold text-foreground">{t("privacyCenter.retentionTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyCenter.retentionBody")}</p>
        </GlassPanel>
      </div>

      <div id="privacy-rights" className="scroll-mt-24">
        <GlassPanel className="mt-6 p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">{t("privacyCenter.rightsTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("privacyCenter.rightsBody")}</p>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("privacyCenter.rightsCta")}
          </Link>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-6 p-6">
        <p className="text-sm text-muted-foreground">{t("privacyCenter.footer")}</p>
        <Link href="/privacy-policy" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          {t("privacyCenter.policyLink")}
        </Link>
      </GlassPanel>
    </div>
  );
}
