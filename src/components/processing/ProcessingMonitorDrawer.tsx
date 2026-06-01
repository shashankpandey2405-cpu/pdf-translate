"use client";

import { Activity, Cloud, Shield, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProcessingMonitor } from "@/context/ProcessingMonitorContext";
import { cn } from "@/lib/utils";

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type Props = {
  className?: string;
};

/** Live processing transparency — local vs cloud, upload count, file size. */
export function ProcessingMonitorDrawer({ className }: Props) {
  const { t } = useTranslation();
  const { state } = useProcessingMonitor();

  if (!state.active && state.mode === "idle") return null;

  const isLocal = state.mode === "browser";
  const zeroNetwork = isLocal && state.networkUploads === 0;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-border/70 bg-card/80 p-4 text-xs shadow-sm backdrop-blur-md",
        className,
      )}
      aria-label={t("monitor.title", { defaultValue: "Processing monitor" })}
    >
      <p className="mb-3 flex items-center gap-2 font-semibold text-foreground">
        <Activity className="h-4 w-4 text-indigo-600" aria-hidden />
        {t("monitor.title", { defaultValue: "Processing monitor" })}
      </p>
      <ul className="space-y-2 text-muted-foreground">
        <li className="flex items-start gap-2">
          {isLocal ? (
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
          )}
          <span>
            <strong className="text-foreground">
              {isLocal
                ? t("monitor.modeLocal", { defaultValue: "Private Local" })
                : t("monitor.modeCloud", { defaultValue: "Turbo Cloud" })}
            </strong>
            {state.fileName ? ` · ${state.fileName}` : null}
          </span>
        </li>
        {state.fileSizeBytes ? (
          <li>
            {t("monitor.fileSize", { defaultValue: "File size" })}:{" "}
            <strong className="text-foreground">{formatBytes(state.fileSizeBytes)}</strong>
          </li>
        ) : null}
        <li className="flex items-start gap-2">
          <Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {zeroNetwork
              ? t("monitor.zeroUploads", {
                  defaultValue: "0 network uploads — file stayed on this device.",
                })
              : t("monitor.uploadCount", {
                  defaultValue: "{{count}} secure upload(s) for cloud processing.",
                  count: state.networkUploads,
                })}
          </span>
        </li>
        {!isLocal ? (
          <li className="text-[11px] italic">
            {t("monitor.autoDelete", {
              defaultValue: "Cloud copies are auto-deleted after processing.",
            })}
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
