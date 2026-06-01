import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const faqItems = [
    { question: t("privacyPage.faq.storeQ"), answer: t("privacyPage.faq.storeA") },
    { question: t("privacyPage.faq.collectQ"), answer: t("privacyPage.faq.collectA") },
    { question: t("privacyPage.faq.adsQ"), answer: t("privacyPage.faq.adsA") },
  ];
  return (
    <InformationLayout
      title={t("privacyPage.title")}
      subtitle={t("privacyPage.subtitle")}
    >
      <section className="space-y-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h2 className="text-2xl font-bold text-foreground">{t("privacyPage.sections.privacyFirstTitle")}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {t("privacyPage.sections.privacyFirstDesc")}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">{t("privacyPage.sections.clientTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("privacyPage.sections.clientDesc")}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-background p-8">
            <h3 className="text-xl font-semibold text-foreground">{t("privacyPage.sections.storageTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t("privacyPage.sections.storageDesc")}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">{t("privacyPage.sections.secureTitle")}</h3>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground list-disc list-inside">
            <li>{t("privacyPage.sections.secureItem1")}</li>
            <li>{t("privacyPage.sections.secureItem2")}</li>
            <li>{t("privacyPage.sections.secureItem3")}</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h2 className="text-2xl font-bold text-foreground">{t("privacyPage.sections.googleOAuthTitle")}</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">{t("privacyPage.sections.googleOAuthIntro")}</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground list-disc list-inside">
            <li>{t("privacyPage.sections.googleOAuthItem1")}</li>
            <li>{t("privacyPage.sections.googleOAuthItem2")}</li>
            <li>{t("privacyPage.sections.googleOAuthItem3")}</li>
            <li>{t("privacyPage.sections.googleOAuthItem4")}</li>
            <li>{t("privacyPage.sections.googleOAuthItem5")}</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("privacyPage.sections.hostingTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("privacyPage.sections.hostingDesc")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">
            {t("privacyPage.sections.subprocessorsTitle", { defaultValue: "Service providers (subprocessors)" })}
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {t("privacyPage.sections.subprocessorsDesc")}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">
            {t("privacyPage.sections.rightsTitle", { defaultValue: "Your rights & requests" })}
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("privacyPage.sections.rightsDesc")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h3 className="text-xl font-semibold text-foreground">{t("privacyPage.sections.advertisingTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("privacyPage.sections.advertisingDesc")}</p>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground">{t("privacyPage.sections.contactPrivacyTitle")}</h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("privacyPage.sections.contactPrivacyDesc")}</p>
        </div>
      </section>

      <FAQSection items={faqItems} />
    </InformationLayout>
  );
}
