import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { useTranslation } from "react-i18next";

export default function CookiePolicy() {
  const { t } = useTranslation();
  const faqItems = [
    { question: t("cookiePage.faq.whatQ"), answer: t("cookiePage.faq.whatA") },
    { question: t("cookiePage.faq.adsQ"), answer: t("cookiePage.faq.adsA") },
    { question: t("cookiePage.faq.controlQ"), answer: t("cookiePage.faq.controlA") },
  ];
  return (
    <InformationLayout title={t("cookiePage.title")} subtitle={t("cookiePage.subtitle")}>
      <section className="space-y-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h2 className="text-2xl font-bold text-foreground">{t("cookiePage.sections.overviewTitle")}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("cookiePage.sections.overviewDesc")}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">{t("cookiePage.sections.essentialTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("cookiePage.sections.essentialDesc")}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">{t("cookiePage.sections.functionalTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("cookiePage.sections.functionalDesc")}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">{t("cookiePage.sections.adsTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("cookiePage.sections.adsDesc")}</p>
        </div>
        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("cookiePage.sections.contactTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("cookiePage.sections.contactDesc")}</p>
        </div>
      </section>
      <FAQSection items={faqItems} />
    </InformationLayout>
  );
}
