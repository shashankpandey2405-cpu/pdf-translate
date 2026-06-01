import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { AboutPageSEO } from "@/components/about/AboutPageSEO";
import { FounderStorySections } from "@/components/about/FounderStorySections";
import { AboutComplianceSection } from "@/components/about/AboutComplianceSection";
import { Shield, Sparkles, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fadeUp, fadeUpTransition } from "@/components/premium/motion";

const PILLARS = [
  { key: "privacy", icon: Shield },
  { key: "ai", icon: Sparkles },
  { key: "access", icon: Globe },
] as const;

export default function AboutUs() {
  const { t } = useTranslation();
  const faqItems = [
    { question: t("aboutPage.faq.safeQ"), answer: t("aboutPage.faq.safeA") },
    { question: t("aboutPage.faq.storeQ"), answer: t("aboutPage.faq.storeA") },
    { question: t("aboutPage.faq.freeQ"), answer: t("aboutPage.faq.freeA") },
  ];

  return (
    <>
      <AboutPageSEO />
      <InformationLayout
        title={t("aboutPage.visionH1", {
          defaultValue: "Redefining Document Intelligence for a Privacy-First Future.",
        })}
        subtitle={t("aboutPage.subtitle")}
        showAiFactSheet={false}
        suppressHelmet
      >
        <div className="mx-auto max-w-4xl space-y-14">
          <motion.section {...fadeUp} transition={fadeUpTransition} className="relative">
            <div
              className="pointer-events-none absolute -inset-x-8 top-0 h-64 rounded-full bg-indigo-500/10 blur-[100px]"
              aria-hidden
            />
            <div className="relative rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-md sm:p-12 dark:border-slate-700/50 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                {t("aboutPage.missionLabel", { defaultValue: "Our Mission" })}
              </p>
              <p className="mt-6 text-base leading-[1.85] text-slate-500 sm:text-lg dark:text-slate-400">
                {t("aboutPage.missionBody", {
                  defaultValue:
                    "At PDFTrusted, our mission is to democratize advanced document processing. We believe that professional-grade AI tools shouldn't come with a premium price tag or a compromise on privacy. We are building the world's most secure, browser-native AI platform where your documents never leave your sight, and your productivity has no limits.",
                })}
              </p>
            </div>
          </motion.section>

          <section>
            <h2 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t("aboutPage.whyExistTitle", { defaultValue: "Why we exist" })}
            </h2>
            <p className="mt-4 text-base leading-[1.85] text-slate-500 dark:text-slate-400">
              {t("aboutPage.whyExistBody", {
                defaultValue:
                  "Traditional PDF tools are heavy, expensive, and outdated. We engineered PDFTrusted to be 'Neural-Native'—integrating cutting-edge AI directly into your browser. Whether it's 90% compression* or instant AI-powered summaries, we provide the speed of a native app with the accessibility of the web.",
              })}
            </p>
            <p className="mt-2 text-xs text-slate-400">* Results vary by document.</p>
          </section>

          <section>
            <h2 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t("aboutPage.pillarsTitle", { defaultValue: "The three pillars" })}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {PILLARS.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                    {t(`aboutPage.pillars.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(`aboutPage.pillars.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <AboutComplianceSection />
        </div>

        <div className="content-auto mt-16">
          <FounderStorySections />
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <FAQSection items={faqItems} />
        </div>
      </InformationLayout>
    </>
  );
}
