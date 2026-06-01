"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cloud, Monitor } from "lucide-react";
import { getToolLimitsDisplay } from "@/lib/limits/toolLimitsDisplay";
import { cn } from "@/lib/utils";

type ToolLimitsPanelProps = {
  toolSlug: string;
  className?: string;
};

export function ToolLimitsPanel({ toolSlug, className }: ToolLimitsPanelProps) {
  const { t } = useTranslation();
  const display = useMemo(() => getToolLimitsDisplay(toolSlug), [toolSlug]);

  if (!display.rows.length) return null;

  return (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-xl border border-border/80 bg-background/80",
        className,
      )}
      role="region"
      aria-label={t("toolLimits.regionLabel", { defaultValue: "Processing limits for this tool" })}
    >
      <div className="border-b border-border/70 bg-muted/30 px-3 py-2 sm:px-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("toolLimits.title", { defaultValue: "Limits on this device" })}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("toolLimits.deviceHint", {
            tier: display.deviceTier,
            defaultValue: "Detected: {{tier}} — values below avoid browser crashes.",
          })}
        </p>
      </div>

      <div className="table-scroll border-t border-border/70">
        <table className="w-full min-w-[280px] text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="px-3 py-2 font-medium sm:px-4" scope="col">
                {t("toolLimits.colLimit", { defaultValue: "Limit" })}
              </th>
              <th className="px-3 py-2 font-medium sm:px-4" scope="col">
                <span className="inline-flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" aria-hidden />
                  {t("toolLimits.colBrowser", { defaultValue: display.browserColumnTitle })}
                </span>
              </th>
              {display.showPremiumColumn ? (
                <th className="px-3 py-2 font-medium sm:px-4" scope="col">
                  <span className="inline-flex items-center gap-1">
                    <Cloud className="h-3.5 w-3.5 text-primary" aria-hidden />
                    {t("toolLimits.colCloud", { defaultValue: display.premiumColumnTitle })}
                  </span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {display.rows.map((row) => (
              <tr key={row.id} className="border-b border-border/40 last:border-0">
                <th className="px-3 py-2.5 font-normal text-muted-foreground sm:px-4" scope="row">
                  {t(`toolLimits.rows.${row.id}`, { defaultValue: row.label })}
                </th>
                <td className="px-3 py-2.5 text-foreground/90 sm:px-4">{row.browser}</td>
                {display.showPremiumColumn ? (
                  <td className="px-3 py-2.5 text-foreground/90 sm:px-4">{row.premium}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border/40 bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground lg:hidden">
        ← Scroll horizontally for all limits →
      </p>

      {display.footnote ? (
        <p className="border-t border-border/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground sm:px-4">
          {display.footnote}
        </p>
      ) : null}
    </div>
  );
}
