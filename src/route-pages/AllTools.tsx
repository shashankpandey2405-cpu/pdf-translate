"use client";

import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { getToolGroups, getToolHref } from "../../constants/tools";
import { filterLiveToolGroups } from "../../constants/toolStatus";
import { useTranslation } from "react-i18next";
import ToolSEO from "@/components/ToolSEO";

export default function AllTools() {
  const { t, i18n } = useTranslation();
  const toolGroups = filterLiveToolGroups(getToolGroups(t));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <ToolSEO
        title={t("allToolsPageTitle")}
        description={t("allToolsPageSubtitle")}
        slug="all-tools"
        lang={i18n.language}
      />
      <h1 className="mb-3 text-3xl font-extrabold text-foreground sm:text-4xl">{t("allToolsPageTitle")}</h1>
      <p className="mb-10 text-muted-foreground">{t("allToolsPageSubtitle")}</p>

      <div className="space-y-8">
        {toolGroups.map((group) => (
          <section key={group.category} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 text-xl font-bold text-foreground">{group.category}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((tool) => (
                <Link
                  key={tool.slug}
                  href={getToolHref(tool)}
                  className="group rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  <h3 className="font-semibold text-foreground">{tool.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tool.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    {t("common.openTool")}{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
