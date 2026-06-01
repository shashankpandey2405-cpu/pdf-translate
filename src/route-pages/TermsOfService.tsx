import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { useTranslation } from "react-i18next";

export default function TermsOfService() {
  const { t } = useTranslation();
  const faqItems = [
    { question: t("termsPage.faq.freeQ"), answer: t("termsPage.faq.freeA") },
    { question: t("termsPage.faq.uploadQ"), answer: t("termsPage.faq.uploadA") },
    { question: t("termsPage.faq.businessQ"), answer: t("termsPage.faq.businessA") },
  ];
  return (
    <InformationLayout
      title={t("termsPage.title")}
      subtitle={t("termsPage.subtitle")}
    >
      <section className="space-y-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h2 className="text-2xl font-bold text-foreground">{t("termsPage.sections.usingTitle")}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {t("termsPage.sections.usingDesc")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">{t("termsPage.sections.responsibilityTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("termsPage.sections.responsibilityDesc")}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">{t("termsPage.sections.availabilityTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("termsPage.sections.availabilityDesc")}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">{t("termsPage.sections.thirdPartyTitle")}</h3>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {t("termsPage.sections.thirdPartyDesc")}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("termsPage.sections.accountsTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("termsPage.sections.accountsDesc")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">{t("termsPage.sections.paymentsTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("termsPage.sections.paymentsDesc")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("termsPage.sections.serviceHostTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("termsPage.sections.serviceHostDesc")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">{t("termsPage.sections.liabilityTitle")}</h3>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("termsPage.sections.liabilityDesc")}</p>
        </div>
      </section>

      <FAQSection items={faqItems} />
    </InformationLayout>
  );
}
