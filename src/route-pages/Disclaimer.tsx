import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { useTranslation } from "react-i18next";

export default function Disclaimer() {
  const { t } = useTranslation();
  const faqItems = [
    { question: t("disclaimerPage.faq.accuracyQ"), answer: t("disclaimerPage.faq.accuracyA") },
    { question: t("disclaimerPage.faq.legalQ"), answer: t("disclaimerPage.faq.legalA") },
  ];
  return (
    <InformationLayout title={t("disclaimerPage.title")} subtitle={t("disclaimerPage.subtitle")}>
      <section className="space-y-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h2 className="text-2xl font-bold text-foreground">{t("disclaimerPage.sections.generalTitle")}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("disclaimerPage.sections.generalDesc")}</p>
        </div>
        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("disclaimerPage.sections.noWarrantyTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("disclaimerPage.sections.noWarrantyDesc")}</p>
        </div>
        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("disclaimerPage.sections.thirdPartyTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("disclaimerPage.sections.thirdPartyDesc")}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">{t("disclaimerPage.sections.limitationTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("disclaimerPage.sections.limitationDesc")}</p>
        </div>
      </section>
      <FAQSection items={faqItems} />
    </InformationLayout>
  );
}
