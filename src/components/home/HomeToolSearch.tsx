"use client";

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getToolGroups, getToolHref } from "../../../constants/tools";
import { isToolLive } from "../../../constants/toolStatus";
import { ToolTierBadge } from "@/components/processing/ToolTierBadge";
import { getToolProcessingBadge } from "@/lib/processing/toolProfiles";

type Filter = "all" | "browser" | "premium" | "hybrid";

export function HomeToolSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: t("home.filter.all", { defaultValue: "All" }) },
    { id: "premium", label: t("home.filter.premium", { defaultValue: "Premium cloud" }) },
    { id: "hybrid", label: t("home.filter.hybrid", { defaultValue: "Hybrid" }) },
    { id: "browser", label: t("home.filter.browser", { defaultValue: "Browser" }) },
  ];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = getToolGroups(t).flatMap((g) => g.items);
    return all.filter((tool) => {
      if (!isToolLive(tool.slug)) return false;
      if (q && !tool.label.toLowerCase().includes(q) && !tool.slug.includes(q)) return false;
      const badge = getToolProcessingBadge(tool.slug);
      if (filter === "premium" && badge !== "cloud_premium") return false;
      if (filter === "browser" && badge !== "browser") return false;
      if (filter === "hybrid" && badge !== "hybrid" && badge !== "cloud_premium") return false;
      return true;
    }).slice(0, 12);
  }, [filter, query, t]);

  return (
    <section className="mb-12 rounded-3xl border border-border bg-card/50 p-4 sm:p-6">
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("home.searchPlaceholder", { defaultValue: "Search PDF tools…" })}
          className="w-full min-h-[48px] rounded-2xl border border-border bg-background py-3 pl-11 pr-4 text-sm touch-manipulation"
        />
      </label>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold touch-manipulation ${
              filter === chip.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {query || filter !== "all" ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {results.map((tool) => (
            <li key={tool.slug}>
              <Link
                href={getToolHref(tool)}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:border-primary/40"
              >
                <span className="truncate">{tool.label}</span>
                <ToolTierBadge slug={tool.slug} />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
