import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ToolHowItWorksProps = {
  toolName: string;
  multiple?: boolean;
  /** When set, uses tools.{slug}.howTo.* i18n keys when present. */
  slug?: string;
  className?: string;
};

export default function ToolHowItWorks({ toolName, multiple = false, slug, className }: ToolHowItWorksProps) {
  const { t, i18n } = useTranslation();
  const steps = useMemo(() => {
    const base = slug ? `tools.${slug}.howTo` : "";
    const hasCustom = Boolean(slug && i18n.exists(`${base}.step1Title`));
    if (hasCustom) {
      return [
        { n: "01", title: t(`${base}.step1Title`), desc: t(`${base}.step1Desc`) },
        { n: "02", title: t(`${base}.step2Title`), desc: t(`${base}.step2Desc`) },
        { n: "03", title: t(`${base}.step3Title`), desc: t(`${base}.step3Desc`) },
      ];
    }
    return [
      { n: "01", title: t("toolPage.step1Title"), desc: multiple ? t("toolPage.step1Multi") : t("toolPage.step1Single") },
      { n: "02", title: t("toolPage.step2Title"), desc: t("toolPage.step2Desc") },
      { n: "03", title: t("toolPage.step3Title"), desc: t("toolPage.step3Desc") },
    ];
  }, [i18n, multiple, slug, t]);

  return (
    <section
      className={cn("rounded-3xl border border-border bg-card/80 p-5 shadow-sm shadow-primary/5 sm:p-6", className)}
      aria-labelledby="tool-how-it-works-title"
    >
      <div className="mb-4">
        <h2 id="tool-how-it-works-title" className="text-lg font-bold text-foreground sm:text-xl">
          {t("toolHowItWorks.titleForTool", {
            toolName,
            defaultValue: `How to use ${toolName}`,
          })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("toolHowItWorks.subtitle", { toolName })}</p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {s.n}
            </div>
            <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
