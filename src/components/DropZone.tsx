"use client";

import { useState, useCallback, useRef, useId, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { Upload, FileType, CheckCircle2, Shield } from "lucide-react";
import { NeuralLoading } from "@/components/ai/NeuralLoading";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TOOL_DROPZONE_MIN_H } from "@/components/tools/ux/toolUxClasses";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { prefetchPdfStack } from "@/lib/lazy";

interface DropZoneProps {
  onFiles: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  /** 0–100 while uploading to staging (optional). */
  uploadProgress?: number;
  /** Shown under the progress bar when `uploadProgress` is set. */
  statusLabel?: string;
  className?: string;
  /** Keep success UI until unmount (do not revert to empty placeholder). */
  lockSuccess?: boolean;
}

function normalizeAccept(accept: string) {
  return accept
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchesAccept(file: File, accept: string) {
  const rules = normalizeAccept(accept);
  if (!rules.length) return true;

  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  return rules.some((r) => {
    const rule = r.toLowerCase();
    if (rule === "*/*") return true;
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, -1);
      return type.startsWith(prefix);
    }
    if (rule.startsWith(".")) return name.endsWith(rule);
    return type === rule;
  });
}

type Phase = "idle" | "busy" | "success";

export default memo(function DropZone({
  onFiles,
  accept = ".pdf,application/pdf",
  multiple = true,
  label,
  sublabel,
  uploadProgress,
  statusLabel,
  className,
  lockSuccess = true,
}: DropZoneProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const reduceMotion = useReducedMotion();

  const determinate =
    typeof uploadProgress === "number" &&
    !Number.isNaN(uploadProgress) &&
    uploadProgress >= 0 &&
    uploadProgress <= 100;

  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    };
  }, []);

  const finishSuccess = useCallback(() => {
    if (lockSuccess) return;
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    successTimerRef.current = window.setTimeout(() => {
      setPhase("idle");
      successTimerRef.current = null;
    }, 2200);
  }, [lockSuccess]);

  const deliverFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setPhase("busy");
      try {
        await Promise.resolve(onFiles(files));
      } catch (err) {
        setPhase("idle");
        toast.error(t("dropZone.uploadFailed", { defaultValue: "Upload failed" }), {
          description:
            err instanceof Error
              ? err.message
              : t("dropZone.uploadFailedHint", { defaultValue: "Check the file type and try again." }),
        });
        return;
      }
      setPhase("success");
      finishSuccess();
    },
    [onFiles, finishSuccess, t],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (phase !== "idle") return;
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file && matchesAccept(file, accept)) files.push(file);
      }
      if (!files.length) return;
      e.preventDefault();
      void deliverFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [accept, deliverFiles, phase]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => matchesAccept(f, accept));
      if (!files.length && e.dataTransfer.files.length > 0) {
        toast.error(t("dropZone.invalidType", { defaultValue: "Unsupported file type" }), {
          description: t("dropZone.invalidTypeHint", { defaultValue: "Choose a supported format and try again." }),
        });
        return;
      }
      void deliverFiles(files);
    },
    [accept, deliverFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDragging(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) => matchesAccept(f, accept));
      if (inputRef.current) inputRef.current.value = "";
      void deliverFiles(files);
    },
    [accept, deliverFiles],
  );

  const showDragShimmer = dragging && phase === "idle" && !determinate;

  const dragOverlay =
    dragging && phase === "idle" && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-background/50 backdrop-blur-sm"
            aria-hidden
          >
            <div className="rounded-3xl border-2 border-dashed border-indigo-500 bg-white/90 px-10 py-8 text-center shadow-2xl backdrop-blur-md dark:bg-slate-900/90">
              <p className="text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
                {t("dropZone.dropToUpload", { defaultValue: "Drop here" })}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{sublabel || t("dropZone.orClickBrowse")}</p>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {dragOverlay}
    <motion.label
      htmlFor={inputId}
      data-testid="dropzone"
      data-dropzone=""
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerEnter={() => prefetchPdfStack()}
      animate={{ scale: reduceMotion || phase !== "idle" ? 1 : dragging ? 1.01 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.15 }}
      aria-busy={phase === "busy"}
      className={cn(
        `pdf-dropzone tap-haptic relative box-border flex w-full max-w-full min-w-0 ${TOOL_DROPZONE_MIN_H} cursor-pointer touch-pan-y select-none flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed px-4 pb-14 pt-16 transition-[border-color,background-color,box-shadow] duration-200 sm:px-6 sm:pb-16 sm:pt-20`,
        dragging && phase === "idle"
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border bg-card/80 backdrop-blur-sm hover:border-primary/60 hover:bg-primary/3",
        phase === "success" ? "border-emerald-500/60 bg-emerald-500/5" : "",
        className,
      )}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
        data-testid="input-file-upload"
      />

      <AnimatePresence mode="wait">
        {phase === "busy" && (
          <motion.div
            key="busy"
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex w-full max-w-full flex-col items-center gap-2 px-4 text-center"
          >
            <NeuralLoading
              title={t("dropZone.uploading")}
              subtitle={t("dropZone.uploadingHint")}
              className="py-4"
            />
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div
            key="success"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col items-center gap-4 px-4 text-center"
          >
            <motion.div
              initial={false}
              animate={{ scale: 1 }}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/15"
            >
              <CheckCircle2 className="h-11 w-11 text-emerald-500" aria-hidden />
            </motion.div>
            <p className="text-xl font-semibold text-foreground">{t("dropZone.successTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("dropZone.successSub")}</p>
          </motion.div>
        )}

        {phase === "idle" && (
          <motion.div
            key={dragging ? "dragging" : "idle"}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-col items-center gap-4 px-4 text-center"
          >
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-2xl transition-colors ${dragging ? "bg-primary" : "bg-primary/10"}`}
            >
              {dragging ? (
                <FileType className="h-10 w-10 text-white" aria-hidden />
              ) : (
                <Upload className="h-10 w-10 text-primary" aria-hidden />
              )}
            </div>
            <div>
              <p className="mb-1 text-xl font-semibold text-foreground">
                {dragging ? t("dropZone.dropToUpload") : label || t("dropZone.dropPdfFiles")}
              </p>
              <p className="text-sm text-muted-foreground">
                {sublabel || t("dropZone.orClickBrowse")}{" "}
                <span className="hidden sm:inline">
                  · {t("dropZone.pasteHint", { defaultValue: "Ctrl+V to paste" })}
                </span>
              </p>
            </div>
            {!dragging && (
              <>
                <span
                  data-testid="button-select-files"
                  className="pointer-events-none inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm shadow-primary/20 press-scale"
                >
                  {t("dropZone.selectFiles")}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  <Shield className="h-3 w-3" aria-hidden />
                  {t("dropZone.privacyHint", { defaultValue: "No signup · Files auto-delete after processing" })}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom progress / drag shimmer */}
      <div className="pointer-events-none absolute inset-x-4 bottom-3 sm:inset-x-8" aria-hidden>
        {determinate ? (
          <div className="space-y-1.5">
            <Progress value={uploadProgress} className="h-2 bg-primary/15" />
            {(statusLabel || t("dropZone.secureStagingHint")) && (
              <p className="text-center text-[11px] font-medium text-muted-foreground">
                {statusLabel ?? t("dropZone.secureStagingHint")}
              </p>
            )}
          </div>
        ) : showDragShimmer ? (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-dropzone-shimmer" />
          </div>
        ) : null}
      </div>
    </motion.label>
    </>
  );
});
