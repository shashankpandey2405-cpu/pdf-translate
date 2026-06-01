import { Clock, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import ToolSEO from "@/components/ToolSEO";
import { FEATURED_HOME_TOOL_SLUGS, getToolHref } from "../../../constants/tools";
import { isToolLive } from "../../../constants/toolStatus";

type Props = {
  slug: string;
  toolName: string;
  description: string;
  category?: string;
  lang?: string;
};

export function ComingSoonTool({ slug, toolName, description, category, lang = "en" }: Props) {
  const { t } = useTranslation();
  const liveLinks = FEATURED_HOME_TOOL_SLUGS.filter((s) => s !== slug && isToolLive(s)).slice(0, 6);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
      <ToolSEO title={toolName} description={description} slug={slug} lang={lang} noIndex />

      {category && (
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {category}
        </span>
      )}

      <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Clock className="h-8 w-8 text-primary" aria-hidden />
      </div>

      <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl">{t("toolPage.comingSoonTitle")}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        {t("toolPage.comingSoonDesc", { tool: toolName })}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{t("toolPage.comingSoonNotify")}</p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/all-tools"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t("toolPage.comingSoonExplore")}
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {t("toolPage.backHome")}
        </a>
      </div>

      <ul className="mt-10 grid gap-2 sm:grid-cols-2 text-left">
        {liveLinks.map((liveSlug) => (
          <li key={liveSlug}>
            <a
              href={getToolHref({ slug: liveSlug })}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
            >
              {t(`tools.${liveSlug}.label`, { defaultValue: liveSlug })}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}