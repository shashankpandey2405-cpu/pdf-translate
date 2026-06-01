"use client";

import { useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { stashAuthIntent } from "@/context/AuthPromptContext";
import { stashPremiumFlow } from "@/lib/auth/premiumFlowRestore";
import { fetchSession } from "@/lib/authSession";
import type { AiDocumentProcessingMode } from "@/lib/processing/aiCloudOptions";
import { Cloud, Cpu, Shield, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAiCreditEstimate } from "@/hooks/useAiCreditEstimate";
import { AiCreditEstimateCard } from "@/components/processing/AiCreditEstimateCard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolSlug: string;
  file: File | null;
  aiTrialRemaining?: number;
  onCancel: () => void;
  onChoose: (mode: AiDocumentProcessingMode) => void | Promise<void>;
};

export function AiDocumentProcessingModal({
  open,
  onOpenChange,
  toolSlug,
  file,
  aiTrialRemaining = 1,
  onCancel,
  onChoose,
}: Props) {
  const { t } = useTranslation();
  const isLgDesktop = useIsLgDesktop();
  const { isSignedIn, refreshSession } = usePremium();
  const { requestSignIn } = useAuthPrompt();

  const { estimate, loading: estimateLoading, error: estimateError } = useAiCreditEstimate(
    toolSlug,
    file,
    open && Boolean(file) && isSignedIn && !isLgDesktop,
  );

  if (isLgDesktop) return null;

  const aiPlusBlocked =
    isSignedIn &&
    !estimateLoading &&
    estimate != null &&
    !estimate.useTrial &&
    !estimate.canProceed;

  const aiPlusBadge =
    aiTrialRemaining > 0 && (!isSignedIn || estimate?.useTrial)
      ? t("aiModes.trialLeft", { defaultValue: "1 trial" })
      : t("aiModes.aiPlus", { defaultValue: "AI Plus" });

  const resolveSignedIn = async (): Promise<boolean> => {
    if (isSignedIn) return true;
    await refreshSession();
    try {
      const data = await fetchSession();
      return Boolean(data.user);
    } catch {
      return false;
    }
  };

  const requireSignIn = async (mode: AiDocumentProcessingMode, reason: string) => {
    if (file) {
      const stashed = await stashPremiumFlow({
        blob: file,
        fileName: file.name,
        mimeType: file.type,
        toolSlug,
        mode: "enhanced",
        settings: { processingMode: mode },
      });
      if (!stashed) {
        toast.error(t("execution.stashFailed"));
        return;
      }
    }
    stashAuthIntent({
      returnPath: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
      desiredMode: "enhanced",
      toolSlug,
      autoStart: Boolean(file),
      deferredAction: "premium-restore",
      reason,
    });
    requestSignIn({ reason, deferredAction: "premium-restore", toolSlug, autoStart: Boolean(file) });
  };

  const pick = async (mode: AiDocumentProcessingMode) => {
    if (mode === "browser") {
      onOpenChange(false);
      await onChoose(mode);
      return;
    }
    if (!(await resolveSignedIn())) {
      await requireSignIn(
        mode,
        mode === "ai_plus"
          ? "Sign in to use AI Plus (free trial or credits)."
          : "Sign in for Trusted Cloud processing.",
      );
      return;
    }
    if (mode === "ai_plus" && aiPlusBlocked) {
      toast.error("Not enough AI credits. Top up your balance or use a smaller PDF.");
      return;
    }
    onOpenChange(false);
    await onChoose(mode);
  };

  const row = (opts: {
    mode: AiDocumentProcessingMode;
    title: string;
    desc: string;
    icon: ReactNode;
    primary?: boolean;
    badge?: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={opts.disabled}
      onClick={() => void pick(opts.mode)}
      className={cn(
        "flex w-full flex-col gap-1 rounded-2xl border p-3.5 text-left transition-all touch-manipulation",
        opts.primary
          ? "border-primary/50 bg-primary/10 ring-1 ring-primary/25"
          : "border-border bg-card hover:border-foreground/20",
        opts.disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-bold text-foreground">
        {opts.icon}
        {opts.title}
        {opts.badge ? (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            {opts.badge}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] leading-snug text-muted-foreground">{opts.desc}</span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88vh,640px)] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("aiModes.title", { defaultValue: "Choose processing" })}</DialogTitle>
          <DialogDescription>
            {file
              ? t("aiModes.file", { name: file.name, defaultValue: "{{name}}" })
              : t("aiModes.desc", { defaultValue: "Browser, OCR cloud, or AI Plus (OpenRouter)." })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 flex flex-col gap-2.5">
          {row({
            mode: "browser",
            title: t("aiModes.browser", { defaultValue: "Browser — no OCR" }),
            desc: t("aiModes.browserDesc", {
              defaultValue: "Extract text locally. No cloud. Best for digital PDFs.",
            }),
            icon: <Shield className="h-4 w-4 text-muted-foreground" />,
          })}
          {row({
            mode: "ocr_cloud",
            title: t("aiModes.ocr", { defaultValue: "Trusted Cloud + OCR" }),
            desc: t("aiModes.ocrDesc", {
              defaultValue: "Searchable PDF via cloud OCR. Uses your daily cloud quota.",
            }),
            icon: <Cloud className="h-4 w-4 text-primary" />,
          })}
          {row({
            mode: "ai_plus",
            title: t("aiModes.aiPlus", { defaultValue: "AI Plus (OCR + AI)" }),
            desc: t("aiModes.aiPlusDesc", {
              defaultValue:
                "15 MB · 10 pages (trial) · OpenRouter. 1 free trial, then AI credits.",
            }),
            icon: <Sparkles className="h-4 w-4 text-primary" />,
            primary: true,
            badge: aiPlusBadge,
            disabled: aiPlusBlocked,
          })}
        </div>

        {isSignedIn && file ? (
          <AiCreditEstimateCard
            className="mt-2"
            estimate={estimate}
            loading={estimateLoading}
            error={estimateError}
          />
        ) : null}

        <p className="mt-2 flex items-start gap-2 text-[10px] text-muted-foreground">
          <Cpu className="mt-0.5 h-3 w-3 shrink-0" />
          {t("aiModes.limitNote", {
            defaultValue: "AI jobs run on Railway workers with automatic cleanup.",
          })}
        </p>

        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            onCancel();
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm text-muted-foreground hover:bg-muted/50"
        >
          <X className="h-4 w-4" />
          {t("execution.cancel")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
