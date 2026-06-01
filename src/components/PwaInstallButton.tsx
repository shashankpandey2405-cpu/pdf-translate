import { useState, useCallback } from "react";
import { DownloadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { InstallModal } from "@/components/pwa/InstallModal";

type Variant = "primary" | "outline" | "footer";

interface Props {
  variant?: Variant;
  className?: string;
  iconClassName?: string;
  /** Close mobile menus etc. */
  onNavigate?: () => void;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60",
  footer:
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60",
};

/**
 * Opens the 3-platform PWA install modal (Android / iOS / Desktop).
 */
export function PwaInstallButton({ variant = "outline", className, iconClassName, onNavigate }: Props) {
  const { t } = useTranslation();
  const { isEffectivelyInstalled, standalone } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);

  const label = standalone
    ? t("pwaInstall.labelStandalone")
    : isEffectivelyInstalled
      ? t("pwaInstall.labelInstalled")
      : t("pwaInstall.labelInstall");

  const handleClick = useCallback(() => {
    onNavigate?.();
    if (standalone) {
      window.focus();
      return;
    }
    setModalOpen(true);
  }, [standalone, onNavigate]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(variantClasses[variant], className)}
        aria-label={label}
      >
        <DownloadCloud className={cn("h-4 w-4 shrink-0", iconClassName)} aria-hidden />
        {label}
      </button>

      <InstallModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
