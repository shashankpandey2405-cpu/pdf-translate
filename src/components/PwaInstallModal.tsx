import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AdSlot from "@/components/AdSlot";
import { useTranslation } from "react-i18next";
import { Share } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: "ios" | "fallback";
  onTryNativeInstall?: () => Promise<void>;
}

/**
 * iOS: Share → Add to Home Screen. Others: browser install hints + optional native retry.
 * Bottom sponsored placement per product request.
 */
export function PwaInstallModal({ open, onOpenChange, variant, onTryNativeInstall }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("pwaInstall.modalTitle")}</DialogTitle>
          <DialogDescription className="text-left">
            {variant === "ios" ? t("pwaInstall.iosIntro") : t("pwaInstall.fallbackIntro")}
          </DialogDescription>
        </DialogHeader>

        {variant === "ios" ? (
          <ol className="list-decimal space-y-3 pl-5 text-sm text-foreground">
            <li>{t("pwaInstall.iosStep1")}</li>
            <li className="flex flex-wrap items-center gap-2">
              <Share className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("pwaInstall.iosStep2")}
            </li>
            <li>{t("pwaInstall.iosStep3")}</li>
            <li>{t("pwaInstall.iosStep4")}</li>
          </ol>
        ) : (
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{t("pwaInstall.androidChromeHint")}</li>
            <li>{t("pwaInstall.desktopHint")}</li>
          </ul>
        )}

        {variant === "fallback" && onTryNativeInstall && (
          <button
            type="button"
            className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={() => void onTryNativeInstall()}
          >
            {t("pwaInstall.tryInstall")}
          </button>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("pwaInstall.sponsored")}</p>
          <AdSlot type="bottom_banner" className="min-h-[88px] w-full max-w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
