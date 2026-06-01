import { ArrowLeft, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useSafeAppBack } from "@/hooks/useSafeAppBack";

interface Props {
  onReset: () => void;
  resetDisabled?: boolean;
  className?: string;
}

/** Shared Back (history) + Reset controls for browser-based tool workflows. */
export function ToolWorkflowActions({ onReset, resetDisabled = false, className }: Props) {
  const { t } = useTranslation();
  const safeBack = useSafeAppBack("/all-tools");

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        data-testid="tool-action-back"
        onClick={safeBack}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted sm:text-sm"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {t("toolPage.back")}
      </button>
      <button
        type="button"
        data-testid="tool-action-reset"
        disabled={resetDisabled}
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 sm:text-sm"
      >
        <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
        {t("toolPage.reset")}
      </button>
    </div>
  );
}
