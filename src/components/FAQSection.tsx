import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
}

export default function FAQSection({ items }: FAQSectionProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-slate-900/5">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">{t("faqSection.badge")}</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground">{t("faqSection.title")}</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t("faqSection.subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.question} className="rounded-3xl border border-border bg-background p-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
              <ChevronDown className="w-5 h-5 text-primary" />
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
