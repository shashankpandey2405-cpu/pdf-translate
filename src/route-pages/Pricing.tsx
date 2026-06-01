import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { FreeVsProComparison } from "@/components/pricing/FreeVsProComparison";
import { PricingGuestBanner } from "@/components/conversion/PricingGuestBanner";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Pricing() {
  const { t } = useTranslation();

  const faqItems = [
    { question: t("pricingPage.faq.billingQ"), answer: t("pricingPage.faq.billingA") },
    { question: t("pricingPage.faq.cancelQ"), answer: t("pricingPage.faq.cancelA") },
    { question: t("pricingPage.faq.freeQ"), answer: t("pricingPage.faq.freeA") },
  ];

  return (
    <div className="bg-gradient-to-tr from-slate-50 via-white to-indigo-50/80 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/30">
      <InformationLayout
        title={t("pricingPage.heroTitle", {
          defaultValue: "Unleash the Full Power of AI-Driven Documents.",
        })}
        subtitle={t("pricingPage.heroSubtitle", {
          defaultValue:
            "Choose the plan that scales with your productivity. Save 100+ hours of manual work with our Neural AI.",
        })}
        showAiFactSheet={false}
      >
        <section className="mx-auto max-w-6xl space-y-12">
          <PricingGuestBanner />

          <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-6 backdrop-blur-md sm:p-8 dark:border-slate-700/50 dark:bg-slate-900/70">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("pricingPage.valueGap.title", { defaultValue: "Why PDFTrusted Pro?" })}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              <li className="flex gap-2">
                <span className="text-indigo-600">→</span>
                {t("pricingPage.valueGap.point1", {
                  defaultValue: "Adobe charges $19.99. We offer more AI for less than a coffee.",
                })}
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-600">→</span>
                {t("pricingPage.valueGap.point2", {
                  defaultValue: "Browser-first privacy. Your files stay under your control.",
                })}
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-600">→</span>
                {t("pricingPage.valueGap.point3", {
                  defaultValue: "Process 100+ files in one go with Pro bulk power.",
                })}
              </li>
            </ul>
          </div>

          <PricingPlans />

          <div>
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
              {t("pricingPage.freeVsPro.title", { defaultValue: "Free vs Pro" })}
            </h2>
            <FreeVsProComparison />
          </div>

          <div className="rounded-3xl border border-border bg-card/80 p-6 text-sm text-slate-500 sm:p-8">
            <p>{t("pricingPage.intro")}</p>
            <p className="mt-4">
              {t("pricingPage.merchantNote")}{" "}
              <Link href="/terms-of-service" className="font-medium text-indigo-600 hover:underline">
                {t("layout.termsLink", { defaultValue: "Terms" })}
              </Link>
              {", "}
              <Link href="/refund-policy" className="font-medium text-indigo-600 hover:underline">
                {t("pricingPage.refundLink", { defaultValue: "Refund Policy" })}
              </Link>
              .
            </p>
          </div>
        </section>

        <FAQSection items={faqItems} />
      </InformationLayout>
    </div>
  );
}
