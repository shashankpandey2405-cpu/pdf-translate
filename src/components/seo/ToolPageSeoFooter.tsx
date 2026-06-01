"use client";

import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ToolHowItWorks from "@/components/tools/ToolHowItWorks";
import ToolTrustStrip from "@/components/tools/ToolTrustStrip";
import { ToolKnowledgeHub } from "@/components/seo/ToolKnowledgeHub";
import { ToolTechnicalSpecs } from "@/components/tools/ToolTechnicalSpecs";

type Props = {
  slug: string;
  toolName: string;
  multiple?: boolean;
  className?: string;
};

/** Collapsible how-to + FAQ block for tool pages (visible content + JSON-LD via ToolSEO bundle). */
export function ToolPageSeoFooter({ slug, toolName, multiple = false, className }: Props) {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <Accordion type="multiple" defaultValue={[]} className="w-full space-y-3">
        <AccordionItem value="how-to" className="rounded-2xl border border-border/60 bg-card/60 px-4 backdrop-blur-sm">
          <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
            {t("toolHowItWorks.titleForTool", {
              toolName,
              defaultValue: `How to use ${toolName}`,
            })}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ToolHowItWorks toolName={toolName} slug={slug} multiple={multiple} className="border-0 bg-transparent p-0 shadow-none" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="faq" className="rounded-2xl border border-border/60 bg-card/60 px-4 backdrop-blur-sm">
          <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
            {t("seo.knowledgeHub.expand", { defaultValue: "Guide & FAQs" })}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ToolKnowledgeHub slug={slug} toolName={toolName} embedded />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <ToolTechnicalSpecs slug={slug} toolName={toolName} />
      <ToolTrustStrip toolSlug={slug} className="mt-6" />
    </div>
  );
}
