"use client";

import { motion } from "framer-motion";
import { Lock, Shield, Server, Globe, Cloud } from "lucide-react";
import { AppPageShell } from "@/components/layout/AppPageShell";
import ToolSEO from "@/components/ToolSEO";
import { GlassPanel } from "@/components/premium/GlassPanel";
import { useTranslation } from "react-i18next";
import { fadeUp, fadeUpTransition } from "@/components/premium/motion";

const ITEMS = [
  { key: "https", icon: Lock },
  { key: "local", icon: Shield },
  { key: "nostorage", icon: Server },
  { key: "sandbox", icon: Globe },
  { key: "cloud", icon: Cloud },
] as const;

export default function Security() {
  const { t, i18n } = useTranslation();

  return (
    <AppPageShell className="py-12 sm:py-16">
      <ToolSEO title={t("securityPage.seoTitle")} description={t("securityPage.seoDesc")} slug="security" lang={i18n.language} />
      <motion.div {...fadeUp} transition={fadeUpTransition}>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{t("securityPage.title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("securityPage.intro")}</p>
      </motion.div>
      <div className="mt-10 space-y-4">
        {ITEMS.map(({ key, icon: Icon }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassPanel className="p-5 flex gap-4">
              <Icon className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h2 className="font-bold">{t(`securityPage.items.${key}.title`)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t(`securityPage.items.${key}.desc`)}</p>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </AppPageShell>
  );
}