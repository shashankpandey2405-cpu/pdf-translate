import InformationLayout from "@/components/InformationLayout";
import { Link } from "wouter";
import { Upload, Cpu, Download, ArrowRight, Smartphone, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { getToolGroups, getToolHref } from "../../constants/tools";
import { filterLiveToolGroups } from "../../constants/toolStatus";

export default function HowToUse() {
  const { t } = useTranslation();
  const groups = filterLiveToolGroups(getToolGroups(t));
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("howToUsePage.title"),
    description: t("howToUsePage.subtitle"),
    step: [
      { "@type": "HowToStep", name: t("howToUsePage.step1Title"), text: t("howToUsePage.step1Desc") },
      { "@type": "HowToStep", name: t("howToUsePage.step2Title"), text: t("howToUsePage.step2Desc") },
      { "@type": "HowToStep", name: t("howToUsePage.step3Title"), text: t("howToUsePage.step3Desc") },
      { "@type": "HowToStep", name: t("howToUsePage.step4Title"), text: t("howToUsePage.step4Desc") },
    ],
  };

  const proTips = [
    t("howToUsePage.proTip1"),
    t("howToUsePage.proTip2"),
    t("howToUsePage.proTip3"),
    t("howToUsePage.proTip4"),
  ];

  return (
    <InformationLayout title={t("howToUsePage.title")} subtitle={t("howToUsePage.subtitle")}>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(howToJsonLd)}</script>
      </Helmet>
      <section className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Upload, title: t("howToUsePage.step1Title"), desc: t("howToUsePage.step1Desc") },
          { icon: Cpu, title: t("howToUsePage.step2Title"), desc: t("howToUsePage.step2Desc") },
          { icon: Download, title: t("howToUsePage.step3Title"), desc: t("howToUsePage.step3Desc") },
          { icon: Smartphone, title: t("howToUsePage.step4Title"), desc: t("howToUsePage.step4Desc") },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-3xl border border-slate-200/50 bg-white/70 p-8 text-center shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/70"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Icon className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-indigo-200/40 bg-indigo-500/[0.04] p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <h2 className="text-xl font-bold text-foreground">{t("howToUsePage.proTipsTitle", { defaultValue: "Pro-Tips" })}</h2>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {proTips.map((tip) => (
            <li key={tip} className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground">Help Center</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Detailed guides and FAQs now live outside tool pages so you can focus on upload → process → download.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/help" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Open Help Center
          </Link>
          <Link href="/guides" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Tool guides
          </Link>
          <Link href="/learn" className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Learn about PDFTrusted
          </Link>
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-border bg-background p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-foreground">{t("howToUsePage.toolsTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("howToUsePage.toolsIntro")}</p>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.categoryKey}>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {group.category}
              </p>
              <ul className="mt-3 space-y-2">
                {group.items.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={getToolHref(tool)}
                      className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {tool.label}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </InformationLayout>
  );
}
