"use client";

import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function HardLockConfirmModal({ open, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-md border-primary/25 sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <DialogTitle className="text-center text-lg">
            {t("hardLock.confirmTitle", { defaultValue: "PDFTrusted Hard Lock is ON" })}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed text-foreground/90 pt-2">
            {t("hardLock.confirmBody", {
              defaultValue:
                "If you proceed, this PDF will be permanently flattened. Text and signatures will no longer be editable in standard PDF editors.",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            {t("hardLock.confirmNo", { defaultValue: "No, keep editable" })}
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={onConfirm}>
            {t("hardLock.confirmYes", { defaultValue: "Yes, Hard Lock my PDF" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
