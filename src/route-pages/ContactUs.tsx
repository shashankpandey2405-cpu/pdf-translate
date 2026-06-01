import InformationLayout from "@/components/InformationLayout";
import FAQSection from "@/components/FAQSection";
import { useTranslation } from "react-i18next";

const faqItems = [
  {
    question: "How can I reach PDFTrusted support?",
    answer: "For general inquiries or feedback, email support@pdftrusted.com. We review all messages and respond as quickly as possible.",
  },
  {
    question: "Can I request a new PDF tool?",
    answer: "Yes. PDFTrusted is actively improved based on user requests. Share your idea and we’ll consider it for future updates.",
  },
  {
    question: "How do I get help?",
    answer: "Email support@pdftrusted.com anytime — we review every message and respond as quickly as we can.",
  },
];

export default function ContactUs() {
  const { t } = useTranslation();
  return (
    <InformationLayout
      title={t("contactPage.title")}
      subtitle={t("contactPage.subtitle")}
    >
      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
          <h2 className="text-2xl font-bold text-foreground">{t("contactPage.needHelpTitle")}</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            {t("contactPage.needHelpDesc")}
          </p>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">{t("contactPage.supportEmail")}</p>
              <p>support@pdftrusted.com</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{t("contactPage.responseTime")}</p>
              <p>{t("contactPage.responseTimeDesc")}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{t("contactPage.premiumSupport")}</p>
              <p>{t("contactPage.premiumSupportDesc")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-background p-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">{t("contactPage.trustTitle")}</h3>
          <ul className="space-y-3 text-sm leading-7 text-muted-foreground list-disc list-inside">
            <li>All PDF work happens in the browser. No files are stored on servers.</li>
            <li>Tool results are available instantly and saved locally when downloaded.</li>
            <li>Ads support the free service while preserving your document privacy.</li>
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-border bg-muted/30 p-8">
        <h2 className="text-xl font-bold text-foreground">
          {t("contactPage.aboutServiceTitle", { defaultValue: "About PDFTrusted support" })}
        </h2>
        <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            {t("contactPage.aboutServiceP1", {
              defaultValue:
                "PDFTrusted provides browser-based and cloud-assisted PDF tools for individuals, students, and businesses worldwide. Our support team helps with account access, billing questions, AI credit usage, and technical issues related to merge, compress, convert, OCR, summarize, and sign workflows.",
            })}
          </p>
          <p>
            {t("contactPage.aboutServiceP2", {
              defaultValue:
                "We do not provide legal advice on document content. For enterprise integrations, data processing agreements, or accessibility requests, email support@pdftrusted.com with your organization name and use case. We typically respond within one to two business days.",
            })}
          </p>
          <p>
            {t("contactPage.aboutServiceP3", {
              defaultValue:
                "Your privacy matters: PDFTrusted processes files with automatic deletion policies for cloud staging. Browser-mode tools keep files on your device. See our Privacy Policy and Security page for full details on retention, cookies, and third-party subprocessors.",
            })}
          </p>
        </div>
      </section>

      <FAQSection items={faqItems} />
    </InformationLayout>
  );
}
