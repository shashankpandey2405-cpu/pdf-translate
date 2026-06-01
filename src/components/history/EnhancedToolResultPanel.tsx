"use client";

import { useCallback, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { EnhancedDownloadWithCountdown } from "@/components/history/EnhancedDownloadWithCountdown";
import { PostResultSignupNudge } from "@/components/conversion/PostResultSignupNudge";
import { CreditUsageBadge } from "@/components/conversion/CreditUsageBadge";
import { ResultReadyLockBanner, ResultReadyReveal } from "@/components/conversion/ResultReadyReveal";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { cn } from "@/lib/utils";
type Props = {
  blob: Blob;
  filename: string;
  objectUrl: string | null;
  secondsLeft: number;
  cloudExpired: boolean;
  persisting?: boolean;
  originalBytes?: number;
  sourceFile?: File | null;
  sourceFiles?: File[];
  toolSlug: string;
  jobId?: string | null;
  creditsUsed?: number;
  onProcessAnother: () => void;
  hideFooterAd?: boolean;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function EnhancedToolResultPanel({
  blob,
  filename,
  objectUrl,
  secondsLeft,
  cloudExpired,
  persisting,
  originalBytes,
  sourceFile,
  sourceFiles,
  toolSlug,
  jobId,
  creditsUsed,
  onProcessAnother,
  hideFooterAd,
}: Props) {
  const { t } = useTranslation();

  const sizeSummary = useMemo(() => {
    if (!originalBytes || originalBytes <= 0) return null;
    const saved = originalBytes - blob.size;
    const pct = Math.round((saved / originalBytes) * 100);
    if (saved > 0 && pct >= 1) {
      return t("enhanced.sizeReduced", {
        defaultValue: "{{before}} → {{after}} ({{pct}}% smaller)",
        before: formatBytes(originalBytes),
        after: formatBytes(blob.size),
        pct,
      });
    }
    return t("enhanced.sizeOutput", {
      defaultValue: "Output size: {{size}}",
      size: formatBytes(blob.size),
    });
  }, [blob.size, originalBytes, t]);

  const handleDownload = useCallback(async () => {
    await safeDownloadBlob(blob, filename);
  }, [blob, filename]);

  return (
    <ResultReadyReveal active={blob.size > 0}>
      {(revealed) => (
    <div className="space-y-4">
      {!revealed ? <ResultReadyLockBanner /> : null}
      <div
        className={cn(
          "rounded-2xl border border-primary/25 bg-primary/5 p-4 transition-opacity duration-300",
          !revealed && "opacity-60",
        )}
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
          {t("enhanced.resultReady", { defaultValue: "Your cloud result is ready" })}
        </p>
        {sizeSummary ? (
          <p className="mt-1 text-xs text-muted-foreground">{sizeSummary}</p>
        ) : null}
        {creditsUsed ? (
          <div className="mt-2">
            <CreditUsageBadge creditsUsed={creditsUsed} />
          </div>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {t("enhanced.resultExpiryHint", {
            defaultValue: "Download now — cloud copies are removed automatically for your privacy.",
          })}
        </p>
      </div>
      <ToolResultPanel
          blob={blob}
          filename={filename}
          sourceFile={sourceFile}
          sourceFiles={sourceFiles}
          toolSlug={toolSlug}
          executedVia="cloud"
          onProcessAnother={onProcessAnother}
          hideFooterAd={hideFooterAd}
          skipResultLock
          resultRevealed={revealed}
          hideSignupNudge
          title="Result preview"
        />
      {revealed ? (
        <>
          <EnhancedDownloadWithCountdown
            filename={filename}
            objectUrl={objectUrl}
            secondsLeft={secondsLeft}
            cloudExpired={cloudExpired}
            persisting={persisting}
            jobId={jobId}
            onDownload={handleDownload}
            className="rounded-2xl border border-border bg-muted/30 p-4"
          />
          <PostResultSignupNudge />
        </>
      ) : null}
    </div>
      )}
    </ResultReadyReveal>
  );
}
