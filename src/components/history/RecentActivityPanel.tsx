"use client";

import { History, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLocalHistory } from "@/hooks/useLocalHistory";

type Props = {
  compact?: boolean;
};

export function RecentActivityPanel({ compact = false }: Props) {
  const { t } = useTranslation();
  const { entries, loading, remove, clearAll, downloadEntry } = useLocalHistory();

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("history.loading", { defaultValue: "Loading recent activity…" })}
      </p>
    );
  }

  if (!entries.length) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
          <History className="h-5 w-5 text-primary" aria-hidden />
          {t("history.title", { defaultValue: "Recent activity" })}
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-400">
          {t("history.empty", { defaultValue: "Completed jobs appear here for quick re-download." })}
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "rounded-2xl border border-border bg-card p-6 space-y-4"}>
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <History className="h-5 w-5 text-primary" />
            {t("history.title", { defaultValue: "Recent activity" })}
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={() => void clearAll()}>
            {t("history.clearAll", { defaultValue: "Clear all" })}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {t("history.disclaimer", {
          defaultValue:
            "Files are stored locally in your browser. Clearing your browser cache or formatting your device will remove this history.",
        })}
      </p>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{entry.fileName}</p>
              <p className="text-[10px] text-muted-foreground">
                {entry.toolName} · {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="min-h-[44px] min-w-[44px]"
                aria-label={t("history.download", { defaultValue: "Download file" })}
                onClick={() => void downloadEntry(entry)}
              >
                <Download className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-[44px] min-w-[44px]"
                aria-label={t("history.remove", { defaultValue: "Remove from history" })}
                onClick={() => void remove(entry.id)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
