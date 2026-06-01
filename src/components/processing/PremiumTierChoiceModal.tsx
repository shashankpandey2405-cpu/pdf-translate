"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PremiumTierChoicePanel } from "@/components/processing/PremiumTierChoicePanel";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSlug: string;
  file: File | null;
  browserDisabledReason?: string | null;
  settingsPanel?: ReactNode;
  onCancel: () => void;
  onChoose: (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => void | Promise<void>;
  compact?: boolean;
};

export function PremiumTierChoiceModal({
  open,
  onOpenChange,
  toolSlug,
  file,
  browserDisabledReason = null,
  settingsPanel,
  onCancel,
  onChoose,
  compact = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-y-auto border-border",
          "left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]",
          compact ? "max-h-[min(70vh,420px)] w-[calc(100vw-2rem)] max-w-sm p-4" : "max-h-[min(88vh,720px)] p-4 sm:p-5",
          !compact &&
            (settingsPanel
              ? "w-[calc(100vw-1.25rem)] max-w-3xl sm:max-w-4xl"
              : "w-[calc(100vw-1.5rem)] max-w-lg sm:max-w-md"),
          "max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:max-h-[85vh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-2xl max-sm:rounded-b-none",
        )}
      >
        <DialogHeader className={cn("space-y-0.5 pr-6 text-left", compact && "space-y-0")}>
          <DialogTitle className={cn("font-bold text-foreground", compact ? "text-base" : "text-lg sm:text-xl")}>
            {t("premiumTier.modalTitle", { defaultValue: "Choose processing" })}
          </DialogTitle>
          {!compact ? (
            <DialogDescription className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
              {file
                ? t("premiumTier.modalFile", { name: file.name, defaultValue: "{{name}} — pick how to process" })
                : t("execution.modalDesc")}
            </DialogDescription>
          ) : file ? (
            <p className="truncate text-[11px] text-muted-foreground">{file.name}</p>
          ) : null}
        </DialogHeader>

        <div className={compact ? "mt-3" : "mt-4"}>
          <PremiumTierChoicePanel
            toolSlug={toolSlug}
            file={file}
            browserDisabledReason={browserDisabledReason}
            settingsPanel={settingsPanel}
            compact={compact}
            onChoose={onChoose}
            onDismiss={() => onOpenChange(false)}
            showHeading={false}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            onCancel();
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50",
            compact ? "mt-2 min-h-[36px]" : "mt-3 min-h-[40px] sm:mt-4",
          )}
        >
          <X className="h-4 w-4" />
          {t("execution.cancel")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
