import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { purgeEnhancedOutput, type CloudPurgeMeta } from "@/lib/enhanced/purgeEnhancedOutput";
import { toast } from "@/hooks/use-toast";

type Props = {
  purge: CloudPurgeMeta;
  disabled?: boolean;
  onPurged?: () => void;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function CloudPermanentDeleteButton({
  purge,
  disabled,
  onPurged,
  size = "sm",
  className,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    const result = await purgeEnhancedOutput(purge);
    setBusy(false);
    setOpen(false);
    if (result.ok) {
      setDone(true);
      onPurged?.();
      toast({
        title: t("enhanced.deleteSuccessTitle", { defaultValue: "Deleted from cloud" }),
        description: t("enhanced.deleteSuccessDesc", {
          defaultValue: "Your file was permanently removed from our servers.",
        }),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("enhanced.deleteFailedTitle", { defaultValue: "Could not delete" }),
        description:
          result.error ||
          t("enhanced.deleteFailedDesc", { defaultValue: "Please sign in and try again." }),
      });
    }
  }

  if (done) {
    return (
      <Button type="button" variant="outline" size={size} disabled className={className}>
        <Trash2 className="h-4 w-4" />
        {t("enhanced.deletedFromCloud", { defaultValue: "Removed from cloud" })}
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={disabled || busy}
          className={`gap-2 text-destructive hover:text-destructive hover:border-destructive/40 ${className ?? ""}`}
          data-testid="button-delete-cloud"
        >
          <Trash2 className="h-4 w-4" />
          {t("enhanced.deleteFromCloud", { defaultValue: "Delete from cloud" })}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("enhanced.deleteConfirmTitle", { defaultValue: "Delete from cloud permanently?" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("enhanced.deleteConfirmDesc", {
              defaultValue:
                "This removes your uploaded PDF and converted file from our servers immediately. You do not need to wait 24 hours. Your download on this device is not affected.",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              void confirmDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy
              ? t("enhanced.deleting", { defaultValue: "Deleting…" })
              : t("enhanced.deleteConfirmAction", { defaultValue: "Delete permanently" })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
