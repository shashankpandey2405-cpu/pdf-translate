"use client";

import { cn } from "@/lib/utils";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt, stashAuthIntent } from "@/context/AuthPromptContext";
import { stashPremiumFlow } from "@/lib/auth/premiumFlowRestore";
import { fetchSession } from "@/lib/authSession";
import { toolOffersOcrTierChoice } from "@/lib/processing/premiumTier";
import { isHybridTool, requiresCloudOnlyProcessing } from "@/lib/processing/toolProfiles";
import { Cloud, Shield, Sparkles, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import type { ReactNode } from "react";

export type PremiumTierChoicePanelProps = {
  toolSlug: string;
  file: File | null;
  browserDisabledReason?: string | null;
  settingsPanel?: ReactNode;
  /** Compact rows for mobile gear sheet. */
  compact?: boolean;
  /** Selection only — sticky CTA runs processing. */
  pickOnly?: boolean;
  onSelect?: (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => void;
  onChoose: (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => void | Promise<void>;
  onDismiss?: () => void;
  showHeading?: boolean;
};

export function PremiumTierChoicePanel({
  toolSlug,
  file,
  browserDisabledReason = null,
  settingsPanel,
  compact = false,
  pickOnly = false,
  onSelect,
  onChoose,
  onDismiss,
  showHeading = true,
}: PremiumTierChoicePanelProps) {
  const { t } = useTranslation();
  const { isSignedIn, refreshSession } = usePremium();
  const { requestSignIn } = useAuthPrompt();

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

  const ocrTier = toolOffersOcrTierChoice(toolSlug);
  const cloudOnly = requiresCloudOnlyProcessing(toolSlug);
  const hybrid = isHybridTool(toolSlug);
  const canUseBrowser = hybrid && !cloudOnly && !browserDisabledReason;
  const splitLayout = Boolean(settingsPanel) && !compact;

  const commitChoice = async (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => {
    onSelect?.(tier, mode);
    if (!pickOnly) {
      onDismiss?.();
      await onChoose(tier, mode);
    }
  };

  const runPro = async () => {
    if (!(await resolveSignedIn())) {
      if (file) {
        const stashed = await stashPremiumFlow({
          blob: file,
          fileName: file.name,
          mimeType: file.type,
          toolSlug,
          mode: "enhanced",
          settings: { premiumTier: "pro" },
        });
        if (!stashed) {
          toast.error(t("execution.stashFailed"));
          return;
        }
      }
      const returnPath =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      stashAuthIntent({
        returnPath,
        desiredMode: "enhanced",
        toolSlug,
        autoStart: Boolean(file),
        deferredAction: "premium-restore",
        reason: t("premiumTier.signInForPro", {
          defaultValue: "Sign in to run Trusted Pro cloud processing.",
        }),
      });
      requestSignIn({
        reason: t("premiumTier.signInForPro", {
          defaultValue: "Sign in to run Trusted Pro cloud processing.",
        }),
        deferredAction: "premium-restore",
        toolSlug,
        autoStart: Boolean(file),
      });
      return;
    }
    await commitChoice("pro", "enhanced");
  };

  const runBrowser = async () => {
    if (!canUseBrowser || browserDisabledReason) return;
    await commitChoice("standard", "browser");
  };

  const runStandard = async () => {
    if (canUseBrowser && !ocrTier) {
      await commitChoice("standard", "browser");
      return;
    }
    if (ocrTier || cloudOnly || hybrid) {
      if (!(await resolveSignedIn()) && (cloudOnly || ocrTier)) {
        if (file) {
          const stashed = await stashPremiumFlow({
            blob: file,
            fileName: file.name,
            mimeType: file.type,
            toolSlug,
            mode: "enhanced",
            settings: { premiumTier: "standard" },
          });
          if (!stashed) {
            toast.error(t("execution.stashFailed"));
            return;
          }
        }
        stashAuthIntent({
          returnPath:
            typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
          desiredMode: "enhanced",
          toolSlug,
          autoStart: Boolean(file),
          deferredAction: "premium-restore",
          reason: t("execution.cloudSignInReason"),
        });
        requestSignIn({
          reason: t("execution.cloudSignInReason"),
          deferredAction: "premium-restore",
          toolSlug,
        });
        return;
      }
      await commitChoice("standard", "enhanced");
      return;
    }
    await commitChoice("standard", "browser");
  };

  const compactRow = (opts: {
    onClick: () => void;
    title: string;
    hint?: string;
    primary?: boolean;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={opts.disabled}
      onClick={opts.onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors touch-manipulation",
        opts.primary
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-border bg-card hover:bg-muted/50",
        opts.disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="min-w-0 text-sm font-semibold text-foreground">{opts.title}</span>
      {opts.hint ? <span className="shrink-0 text-[10px] text-muted-foreground">{opts.hint}</span> : null}
    </button>
  );

  const tierButtons = compact ? (
    <div className="flex flex-col gap-1.5">
      {ocrTier && canUseBrowser
        ? compactRow({
            onClick: () => void runBrowser(),
            title: t("execution.browserTitle", { defaultValue: "Browser" }),
            hint: "RTF",
          })
        : null}
      {compactRow({
        onClick: () => void runPro(),
        title: ocrTier
          ? t("premiumTier.proShort", { defaultValue: "Trusted Pro + OCR" })
          : t("execution.cloudTitle", { defaultValue: "Trusted Cloud" }),
        hint: "Best",
        primary: true,
      })}
      {compactRow({
        onClick: () => void runStandard(),
        title: ocrTier
          ? t("premiumTier.standardShort", { defaultValue: "Standard cloud" })
          : t("execution.browserTitle", { defaultValue: "Browser" }),
        hint: ocrTier ? "Fast" : undefined,
        disabled: Boolean(browserDisabledReason) && !ocrTier && !cloudOnly,
      })}
      {!isSignedIn ? (
        <p className="text-center text-[10px] text-primary">{t("execution.cloudSignInCta")}</p>
      ) : null}
    </div>
  ) : (
    <div className={cn("flex flex-col gap-2.5", splitLayout && "sm:gap-3")}>
      {ocrTier && canUseBrowser ? (
        <button
          type="button"
          onClick={() => void runBrowser()}
          className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-foreground/25 hover:shadow-sm touch-manipulation sm:p-3.5"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            {t("execution.browserTitle", { defaultValue: "Browser" })}
          </span>
          <span className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {t("honestTiers.pdf-to-word.browser", {
              defaultValue: "Fast RTF export — digital PDFs with selectable text.",
            })}
          </span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => void runPro()}
        className="relative flex w-full flex-col gap-1.5 overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/15 via-card to-card p-3.5 text-left shadow-md ring-2 ring-primary/20 transition-all hover:ring-primary/40 hover:shadow-lg touch-manipulation sm:p-4"
      >
        <span className="absolute right-2.5 top-2.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          {t("premiumTier.proBadge", { defaultValue: "Trusted Pro" })}
        </span>
        <span className="flex items-center gap-2 pr-16 text-sm font-bold text-foreground sm:text-base">
          <Sparkles className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
          <Zap className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
          {ocrTier
            ? t("premiumTier.proTitle", { defaultValue: "Trusted Pro — with OCR" })
            : t("execution.cloudTitle")}
        </span>
        <span className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {ocrTier
            ? t("premiumTier.proDesc", {
                defaultValue:
                  "Scanned pages, photos, and complex layouts. OCR + layout reconstruction for the best output.",
              })
            : t("execution.cloudDesc")}
        </span>
        {!isSignedIn ? (
          <span className="text-[11px] font-semibold text-primary sm:text-xs">{t("execution.cloudSignInCta")}</span>
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => void runStandard()}
        disabled={Boolean(browserDisabledReason) && !ocrTier && !cloudOnly}
        className={cn(
          "flex w-full flex-col gap-1 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-foreground/25 hover:shadow-sm touch-manipulation sm:p-3.5",
          browserDisabledReason && !ocrTier && !cloudOnly && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          {canUseBrowser && !ocrTier ? (
            <Shield className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Cloud className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          {ocrTier
            ? t("premiumTier.standardTitle", { defaultValue: "Standard — without OCR" })
            : canUseBrowser
              ? t("execution.browserTitle")
              : t("premiumTier.standardCloud", { defaultValue: "Standard cloud" })}
        </span>
        <span className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {ocrTier
            ? t("premiumTier.standardDesc", {
                defaultValue: "Faster cloud run for text-based PDFs. Best when your file already has selectable text.",
              })
            : canUseBrowser
              ? t("execution.browserDesc")
              : t("execution.cloudDesc")}
        </span>
        {browserDisabledReason ? (
          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">{browserDisabledReason}</span>
        ) : null}
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {showHeading ? (
        <div className="space-y-0.5">
          <p className={cn("font-bold text-foreground", compact ? "text-sm" : "text-base")}>
            {t("premiumTier.modalTitle", { defaultValue: "Choose processing" })}
          </p>
          {file ? (
            <p className="truncate text-[11px] text-muted-foreground">
              {compact
                ? file.name
                : t("premiumTier.modalFile", { name: file.name, defaultValue: "{{name}} — pick how to process" })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("execution.modalDesc")}</p>
          )}
        </div>
      ) : null}

      {splitLayout ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] sm:items-start sm:gap-5">
          <div className="min-w-0">{settingsPanel}</div>
          <div className="flex flex-col gap-2 sm:sticky sm:top-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
              {t("premiumTier.pickTier", { defaultValue: "Processing" })}
            </p>
            {tierButtons}
          </div>
        </div>
      ) : (
        <>
          {settingsPanel ? <div>{settingsPanel}</div> : null}
          {tierButtons}
        </>
      )}
    </div>
  );
}
