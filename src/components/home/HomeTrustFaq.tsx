"use client";

import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { HOME_FAQ_KEYS } from "@/data/seo/homeFaqs";
import { SaasSection } from "@/components/saas/SaasSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HomeTrustFaq() {
  const { t } = useTranslation();

  return (
    <SaasSection muted id="faq" className="home-section-cv">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        {t("home.faq.eyebrow", { defaultValue: "FAQ" })}
      </p>
      <h2 className="saas-heading mt-2">
        {t("home.faq.title", { defaultValue: "Common questions" })}
      </h2>
      <p className="saas-subheading">
        {t("home.faq.subtitle", {
          defaultValue:
            "Straight answers about compression, conversion, AI tools, privacy, and mobile use.",
        })}
      </p>

      <Accordion type="single" collapsible className="mt-8 w-full rounded-2xl border border-border bg-card px-4 sm:px-6">
        {HOME_FAQ_KEYS.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
              {t(`home.faq.items.${key}.q`, { defaultValue: key })}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {t(`home.faq.items.${key}.a`, { defaultValue: "" })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="mt-6 text-sm text-muted-foreground">
        {t("home.faq.more", { defaultValue: "More detail:" })}{" "}
        <Link href="/faq" className="font-semibold text-primary hover:underline">
          {t("layout.faqLink", { defaultValue: "FAQ" })}
        </Link>
        {" · "}
        <Link href="/how-to-use" className="font-semibold text-primary hover:underline">
          {t("layout.howToLink", { defaultValue: "How to Use" })}
        </Link>
      </p>
    </SaasSection>
  );
}
