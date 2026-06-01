"use client";

import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PremiumTierChoiceModal } from "@/components/processing/PremiumTierChoiceModal";
import { toolShowsPremiumChoiceModal } from "@/lib/processing/premiumTier";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import { ExecutionModeSelector } from "@/components/processing/ExecutionModeSelector";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSlug: string;
  file: File | null;
  browserDisabledReason?: string | null;
  settingsPanel?: ReactNode;
  onCancel: () => void;
  onRunPremium?: () => void | Promise<void>;
  onRunNormal?: () => void | Promise<void>;
  onTierChoose?: (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => void | Promise<void>;
  /** Smaller dialog — use when inline picker is already on the page. */
  compact?: boolean;
};

/** Post-upload modal: Standard vs Trusted Pro (OCR), then sign-in if needed. */
export function ProcessingModeModal({
  open,
  onOpenChange,
  toolSlug,
  file,
  browserDisabledReason,
  settingsPanel,
  onCancel,
  onRunPremium,
  onRunNormal,
  onTierChoose,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const isLgDesktop = useIsLgDesktop();
  const useTierModal = toolShowsPremiumChoiceModal(toolSlug) && Boolean(onTierChoose);
  const onChooseTier = onTierChoose ?? (() => {});

  if (isLgDesktop) return null;

  if (useTierModal) {
    return (
      <PremiumTierChoiceModal
        open={open}
        onOpenChange={onOpenChange}
        toolSlug={toolSlug}
        file={file}
        compact={compact}
        browserDisabledReason={browserDisabledReason}
        settingsPanel={settingsPanel}
        onCancel={onCancel}
        onChoose={onChooseTier}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto border-border p-5 sm:max-w-2xl sm:p-8 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-bold sm:text-2xl">{t("execution.modalTitle")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {file
              ? t("execution.modalFile", { name: file.name })
              : t("execution.modalDesc")}
          </DialogDescription>
        </DialogHeader>
        {settingsPanel ? <div className="mt-4">{settingsPanel}</div> : null}
        <ExecutionModeSelector
          toolSlug={toolSlug}
          file={file}
          className={settingsPanel ? "mt-4" : "mt-2"}
          variant="sidebar"
          showCancel={false}
          onCancel={() => {
            onOpenChange(false);
            onCancel();
          }}
          onRunPremium={async () => {
            onOpenChange(false);
            await onRunPremium?.();
          }}
          onRunNormal={async () => {
            onOpenChange(false);
            await onRunNormal?.();
          }}
        />
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            onCancel();
          }}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50"
        >
          <X className="h-4 w-4" />
          {t("execution.cancel")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
