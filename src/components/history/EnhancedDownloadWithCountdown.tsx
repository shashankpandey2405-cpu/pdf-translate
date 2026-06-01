"use client";

import { useCallback, useState } from "react";
import { Download, Shield, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";

type Props = {
  filename: string;
  objectUrl: string | null;
  secondsLeft: number;
  cloudExpired: boolean;
  persisting?: boolean;
  jobId?: string | null;
  onDownload: () => void | Promise<void>;
  className?: string;
};

export function EnhancedDownloadWithCountdown({
  filename,
  objectUrl,
  secondsLeft,
  cloudExpired,
  persisting = false,
  jobId,
  onDownload,
  className = "",
}: Props) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDownload = useCallback(() => {
    void onDownload();
  }, [onDownload]);

  const handleDeleteFromCloud = useCallback(async () => {
    if (!jobId || deleted) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/enhanced/purge-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        setDeleted(true);
        toast({ title: "Permanently deleted from cloud", description: "Your file has been removed from our servers." });
      } else {
        toast({ title: "Delete failed", description: "Try again or the file may already be expired.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }, [jobId, deleted]);

  const countdownActive = !cloudExpired && !deleted && secondsLeft > 0;
  const isCloudGone = cloudExpired || deleted;

  return (
    <div className={`space-y-3 ${className}`} role="group" aria-label="Download result">
      {countdownActive ? (
        <p className="text-center text-xs font-medium text-primary">
          {t("enhanced.cloudCountdown", {
            defaultValue: "Cloud copy removed in {{seconds}}s — file saved in your browser",
            seconds: secondsLeft,
          })}
        </p>
      ) : null}
      {isCloudGone ? (
        <p className="flex items-start justify-center gap-2 text-center text-xs text-muted-foreground">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          {deleted
            ? t("enhanced.cloudDeletedByUser", {
                defaultValue: "You permanently deleted this file from our servers. Zero trace remains.",
              })
            : t("enhanced.cloudPurged", {
                defaultValue: "File permanently deleted from servers for your security.",
              })}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          size="lg"
          className="flex-1 gap-2"
          disabled={persisting || !objectUrl}
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          {persisting
            ? t("enhanced.savingLocal", { defaultValue: "Saving to browser history…" })
            : t("enhanced.downloadLocal", { defaultValue: "Download" })}
        </Button>

        {jobId && !isCloudGone && (
          <Button
            type="button"
            size="lg"
            variant="destructive"
            className="gap-2 shrink-0"
            disabled={deleting}
            onClick={handleDeleteFromCloud}
            title="Permanently delete from cloud servers now"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Delete from Cloud</span>
          </Button>
        )}

        {deleted && (
          <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Deleted
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground truncate">{filename}</p>

      {!isCloudGone && jobId && (
        <p className="text-center text-[10px] text-muted-foreground/70">
          <Shield className="inline h-3 w-3 mr-0.5" />
          Click "Delete from Cloud" to permanently erase from our servers now
        </p>
      )}
    </div>
  );
}
