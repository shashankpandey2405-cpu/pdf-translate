"use client";

import { useTranslation } from "react-i18next";

type Props = {
  slug: string;
  toolName: string;
};

/** Visible technical depth block for SEO + trust (per tool). */
export function ToolTechnicalSpecs({ slug, toolName }: Props) {
  const { t } = useTranslation();

  return (
    <section
      className="mt-6 rounded-2xl border border-border/60 bg-muted/20 px-4 py-5 sm:px-5"
      aria-labelledby="tool-tech-specs-heading"
    >
      <h3 id="tool-tech-specs-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
        {t("seo.technicalSpecs.heading", { defaultValue: "Technical specifications" })}
      </h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-foreground">{t("seo.technicalSpecs.processing", { defaultValue: "Processing" })}</dt>
          <dd className="mt-1 text-muted-foreground">
            {t("seo.technicalSpecs.processingValue", {
              defaultValue: "Browser-first with optional Trusted Cloud for neural document processing.",
            })}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">{t("seo.technicalSpecs.privacy", { defaultValue: "Privacy" })}</dt>
          <dd className="mt-1 text-muted-foreground">
            {t("seo.technicalSpecs.privacyValue", {
              defaultValue: "Privacy-preserving computation; 256-bit transit encryption on cloud jobs; instant-purge protocols.",
            })}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">{t("seo.technicalSpecs.formats", { defaultValue: "Formats" })}</dt>
          <dd className="mt-1 text-muted-foreground">
            {t(`seo.technicalSpecs.formats.${slug}`, {
              defaultValue: "PDF in/out; see tool page for full format support.",
            })}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">{t("seo.technicalSpecs.tool", { defaultValue: "Tool" })}</dt>
          <dd className="mt-1 font-mono text-xs text-muted-foreground">{toolName} · {slug}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("seo.technicalSpecs.compressNote", {
          defaultValue:
            "* Compression results vary by document; advanced algorithms may reduce size by up to 90% while preserving professional-grade visual integrity.",
        })}
      </p>
    </section>
  );
}
