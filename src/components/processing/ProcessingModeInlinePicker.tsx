"use client";

import { Cloud, Monitor, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { toolOffersOcrTierChoice } from "@/lib/processing/premiumTier";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import { requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";

type Props = {
  toolSlug: string;
  browserDisabledReason?: string | null;
  onChoose: (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => void | Promise<void>;
  onOpenModal?: () => void;
  className?: string;
};

/** Visible mode buttons when the post-upload modal does not open or user prefers inline choice. */
export function ProcessingModeInlinePicker({
  toolSlug,
  browserDisabledReason = null,
  onChoose,
  onOpenModal,
  className,
}: Props) {
  const { t } = useTranslation();
  const ocrTier = toolOffersOcrTierChoice(toolSlug);
  const cloudOnly = requiresCloudOnlyProcessing(toolSlug);
  const canBrowser = !cloudOnly && !browserDisabledReason;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {t("honestTiers.title", { defaultValue: "Choose the right mode" })}
      </p>

      {canBrowser ? (
        <button
          type="button"
          onClick={() => void onChoose("standard", "browser")}
          className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 touch-manipulation"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t("execution.browserTitle", { defaultValue: "Browser" })}
          </span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            {t("honestTiers.pdf-to-word.browser", {
              defaultValue: "Fast RTF text export — best for digital PDFs with selectable text.",
            })}
          </span>
        </button>
      ) : browserDisabledReason ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100">
          {browserDisabledReason}
        </p>
      ) : null}

      {ocrTier ? (
        <>
          <button
            type="button"
            onClick={() => void onChoose("standard", "enhanced")}
            className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 touch-manipulation"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Cloud className="h-4 w-4 shrink-0 text-primary" />
              {t("premiumTier.standardTitle", { defaultValue: "Standard — without OCR" })}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {t("premiumTier.standardDesc", {
                defaultValue: "Faster cloud DOCX for text-based PDFs.",
              })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => void onChoose("pro", "enhanced")}
            className="flex w-full flex-col gap-1 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-left transition-colors hover:border-primary hover:bg-primary/15 touch-manipulation"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              {t("premiumTier.proTitle", { defaultValue: "Trusted Pro — with OCR" })}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {t("honestTiers.pdf-to-word.cloud", {
                defaultValue: "DOCX with layout + OCR for scans and complex documents.",
              })}
            </span>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void onChoose("standard", "enhanced")}
          className="flex w-full flex-col gap-1 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-left transition-colors hover:border-primary hover:bg-primary/15 touch-manipulation"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Cloud className="h-4 w-4 shrink-0 text-primary" />
            {t("execution.cloudTitle", { defaultValue: "Trusted Cloud" })}
          </span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            {t("execution.cloudDesc", { defaultValue: "Best quality on secure servers." })}
          </span>
        </button>
      )}

      {onOpenModal ? (
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full py-1 text-center text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          {t("premiumTier.cloudTiers", { defaultValue: "Cloud tiers" })}
        </button>
      ) : null}
    </div>
  );
}
