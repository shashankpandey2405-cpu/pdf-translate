"use client";

import { Cloud, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type HonestTierTool = "compress-pdf" | "pdf-to-word" | "word-to-pdf" | "pdf-to-image";

type Props = {
  tool: HonestTierTool;
  className?: string;
};

/**
 * Clear browser vs Trusted Cloud expectations — reduces bad reviews from wrong tier choice.
 */
export function HonestProcessingTiers({ tool, className }: Props) {
  const { t } = useTranslation();
  const key = `honestTiers.${tool}`;

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm",
        className,
      )}
      role="note"
      aria-label={t("honestTiers.ariaLabel", { defaultValue: "Processing quality by mode" })}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {t("honestTiers.title", { defaultValue: "Choose the right mode" })}
      </p>
      <ul className="mt-2 space-y-2 text-xs leading-relaxed text-foreground/90 sm:text-sm">
        <li className="flex gap-2">
          <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <strong>{t("honestTiers.browserLabel", { defaultValue: "Browser:" })}</strong>{" "}
            {t(`${key}.browser`, {
              defaultValue: t("honestTiers.defaultBrowser", { defaultValue: "Fast and private on your device." }),
            })}
          </span>
        </li>
        <li className="flex gap-2">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            <strong>{t("honestTiers.cloudLabel", { defaultValue: "Trusted Cloud:" })}</strong>{" "}
            {t(`${key}.cloud`, {
              defaultValue: t("honestTiers.defaultCloud", {
                defaultValue: "Best quality on secure servers — sign in to use Trusted Cloud.",
              }),
            })}
          </span>
        </li>
      </ul>
    </div>
  );
}
