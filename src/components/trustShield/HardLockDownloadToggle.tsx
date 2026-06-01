"use client";

import { useCallback, useState } from "react";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HardLockConfirmModal } from "@/components/trustShield/HardLockConfirmModal";
import { hardLockPdfBytes } from "@/lib/trustShield/hardLockPdf";
import { cn } from "@/lib/utils";

export function useHardLockEnabled() {
  const [hardLock, setHardLock] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestToggle = useCallback((next: boolean) => {
    if (!next) {
      setHardLock(false);
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(true);
  }, []);

  const confirmEnable = useCallback(() => {
    setHardLock(true);
    setConfirmOpen(false);
  }, []);

  const cancelEnable = useCallback(() => {
    setHardLock(false);
    setConfirmOpen(false);
  }, []);

  const applyHardLock = useCallback(
    async (pdfBytes: Uint8Array, onProgress?: (page: number, total: number) => void) => {
      if (!hardLock) return pdfBytes;
      return hardLockPdfBytes(pdfBytes, { onProgress });
    },
    [hardLock],
  );

  return {
    hardLock,
    confirmOpen,
    requestToggle,
    confirmEnable,
    cancelEnable,
    applyHardLock,
  };
}

type Props = {
  enabled: boolean;
  onToggleRequest: (next: boolean) => void;
  confirmOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
};

export function HardLockDownloadToggle({
  enabled,
  onToggleRequest,
  confirmOpen,
  onConfirm,
  onCancel,
  className,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3",
          enabled ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Lock className={cn("mt-0.5 h-4 w-4 shrink-0", enabled ? "text-primary" : "text-muted-foreground")} />
          <div>
            <Label htmlFor="hard-lock-toggle" className="text-sm font-semibold text-foreground cursor-pointer">
              {t("hardLock.toggleLabel", { defaultValue: "PDFTrusted Hard Lock" })}
            </Label>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              {t("hardLock.toggleHint", {
                defaultValue: "Power feature — flatten to an immutable image-only PDF before download.",
              })}
            </p>
          </div>
        </div>
        <Switch
          id="hard-lock-toggle"
          checked={enabled}
          onCheckedChange={onToggleRequest}
          aria-label={t("hardLock.toggleLabel", { defaultValue: "PDFTrusted Hard Lock" })}
        />
      </div>
      <HardLockConfirmModal open={confirmOpen} onConfirm={onConfirm} onCancel={onCancel} />
    </>
  );
}
