import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function RefundPolicy() {
  const { t } = useTranslation();
  const faqItems = [
    { question: t("refundPage.faq.howQ"), answer: t("refundPage.faq.howA") },
    { question: t("refundPage.faq.trialQ"), answer: t("refundPage.faq.trialA") },
    { question: t("refundPage.faq.paypalQ"), answer: t("refundPage.faq.paypalA") },
  ];

  return (
    <InformationLayout title={t("refundPage.title")} subtitle={t("refundPage.subtitle")}>
      <section className="space-y-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">{t("refundPage.sections.overviewTitle")}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {t("refundPage.sections.overviewDesc")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">
              {t("refundPage.sections.eligibilityTitle")}
            </h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
              <li>{t("refundPage.sections.eligibility1")}</li>
              <li>{t("refundPage.sections.eligibility2")}</li>
              <li>{t("refundPage.sections.eligibility3")}</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">
              {t("refundPage.sections.nonRefundTitle")}
            </h3>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
              <li>{t("refundPage.sections.nonRefund1")}</li>
              <li>{t("refundPage.sections.nonRefund2")}</li>
              <li>{t("refundPage.sections.nonRefund3")}</li>
            </ul>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-foreground">{t("refundPage.sections.processTitle")}</h3>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("refundPage.sections.processDesc")}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            <li>{t("refundPage.sections.process1")}</li>
            <li>{t("refundPage.sections.process2")}</li>
            <li>{t("refundPage.sections.process3")}</li>
          </ol>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("refundPage.sections.paypalTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("refundPage.sections.paypalDesc")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-foreground">{t("refundPage.sections.contactTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {t("refundPage.sections.contactDesc")}{" "}
            <a href="mailto:support@pdftrusted.com" className="font-medium text-primary hover:underline">
              support@pdftrusted.com
            </a>
            . {t("refundPage.sections.contactAlso")}{" "}
            <Link href="/pricing" className="font-medium text-primary hover:underline">
              {t("pricingPage.title", { defaultValue: "Pricing" })}
            </Link>
            {" · "}
            <Link href="/terms-of-service" className="font-medium text-primary hover:underline">
              {t("layout.termsLink", { defaultValue: "Terms" })}
            </Link>
            .
          </p>
        </div>
      </section>

      <FAQSection items={faqItems} />
    </InformationLayout>
  );
}
