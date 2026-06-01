import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { getGenericKnowledgeCopy } from "@/data/seo/toolSeoBundles";
import { ToolRelatedLinks } from "@/components/seo/ToolRelatedLinks";

interface Props {
  /** Route slug, e.g. merge-pdf or tools/ai-scanner */
  slug: string;
  /** Used when no bundle exists (dynamic ToolPage) */
  toolName?: string;
  /** When true, strips outer section chrome (for accordion embed). */
  embedded?: boolean;
}

/**
 * Collapsible SEO "Knowledge hub": long-form copy + FAQs for rich snippets & UX.
 * Visible to users and crawlers (not hidden — avoid cloaking).
 */
export function ToolKnowledgeHub({ slug, toolName, embedded = false }: Props) {
  const { t, i18n } = useTranslation();
  const bundleKey = slug.replace(/^\/+/, "") || "";

  const bundle = useMemo(
    () => (bundleKey ? getLocalizedToolSeoBundle(i18n.language, bundleKey) : undefined),
    [bundleKey, i18n.language],
  );
  const generic = useMemo(() => {
    if (bundle) return null;
    return getGenericKnowledgeCopy(toolName || bundleKey.replace(/-/g, " "));
  }, [bundle, bundleKey, toolName]);

  const displayName =
    toolName || bundle?.title?.split("|")[0]?.trim() || bundleKey.replace(/-/g, " ");
  const hubTitle =
    bundleKey.length > 0
      ? t("seo.knowledgeHub.titleForTool", {
          tool: displayName,
          defaultValue: `${displayName} — guide & FAQs`,
        })
      : t("seo.knowledgeHub.title", { defaultValue: "Knowledge hub" });

  const paragraphs = bundle?.bodyParagraphs ?? generic?.bodyParagraphs ?? [];
  const faqs = bundle?.faqs ?? generic?.faqs ?? [];

  if (paragraphs.length === 0 && faqs.length === 0) return null;

  return (
    <section
      className={
        embedded
          ? "space-y-4"
          : "mt-14 scroll-mt-24 border-t border-border pt-10"
      }
      aria-labelledby={embedded ? undefined : "knowledge-hub-heading"}
    >
      {!embedded ? (
        <>
          <h2 id="knowledge-hub-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {hubTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {t("seo.knowledgeHub.subtitle", {
              defaultValue:
                "Deep-dive guide, FAQs, and how-to context for this PDFTrusted tool — optimized for clarity and search visibility.",
            })}
          </p>
        </>
      ) : null}

      <Accordion type="single" collapsible className="mt-6 w-full rounded-2xl border border-border bg-card px-4 shadow-sm sm:px-6">
        <AccordionItem value="guide" className="border-none">
          <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
            {t("seo.knowledgeHub.expand", { defaultValue: "Read guide & FAQs" })}
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-6 text-sm leading-relaxed text-muted-foreground">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="border-t border-border pt-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground">
                {t("seo.knowledgeHub.faqHeading", { defaultValue: "Frequently asked questions" })}
              </h3>
              <ul className="space-y-4">
                {faqs.map((f) => (
                  <li key={f.question} className="rounded-2xl bg-muted/40 px-4 py-3">
                    <p className="font-semibold text-foreground">{f.question}</p>
                    <p className="mt-1.5 text-muted-foreground">{f.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <ToolRelatedLinks slug={slug} />
    </section>
  );
}
