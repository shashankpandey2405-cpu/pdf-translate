"use client";

import { useId, useRef } from "react";
import { Camera, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { maxFileMbForTier } from "@/lib/limits/fileSizePolicy";

type Props = {
  onFiles: (files: File[]) => void | Promise<void>;
  acceptPdf?: boolean;
  acceptImages?: boolean;
  enableCamera?: boolean;
  isPremium?: boolean;
  className?: string;
  disabled?: boolean;
};

export function MobileFileUpload({
  onFiles,
  acceptPdf = true,
  acceptImages = true,
  enableCamera = true,
  isPremium = false,
  className,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const cameraId = useId();
  const fileId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptParts: string[] = [];
  if (acceptPdf) acceptParts.push("application/pdf", ".pdf");
  if (acceptImages) acceptParts.push("image/*", ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif");
  const accept = acceptParts.join(",");

  const limitMb = maxFileMbForTier(isPremium);

  const deliver = (list: FileList | null) => {
    if (!list?.length || disabled) return;
    void Promise.resolve(onFiles(Array.from(list)));
    if (cameraRef.current) cameraRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-indigo-200 bg-white/50 p-6 backdrop-blur-sm dark:border-indigo-500/30 dark:bg-slate-900/40",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <div className="flex flex-wrap justify-center gap-3">
        {enableCamera && acceptImages ? (
          <label
            htmlFor={cameraId}
            className="press-scale flex min-h-[44px] min-w-[44px] cursor-pointer flex-col items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-white transition-colors hover:bg-indigo-700 sm:h-32 sm:w-32"
          >
            <Camera className="mb-2 h-8 w-8" aria-hidden />
            <span className="text-xs font-bold">
              {t("upload.takePhoto", { defaultValue: "Take Photo" })}
            </span>
            <input
              id={cameraId}
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={disabled}
              onChange={(e) => deliver(e.target.files)}
            />
          </label>
        ) : null}

        <label
          htmlFor={fileId}
          className="press-scale flex min-h-[44px] min-w-[44px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 transition-colors hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 sm:h-32 sm:w-32"
        >
          <Upload className="mb-2 h-8 w-8" aria-hidden />
          <span className="text-xs font-bold">
            {acceptPdf && acceptImages
              ? t("upload.filesOrPdf", { defaultValue: "Files / PDF" })
              : acceptPdf
                ? t("upload.pdfOnly", { defaultValue: "PDF" })
                : t("upload.images", { defaultValue: "Images" })}
          </span>
          <input
            id={fileId}
            ref={fileRef}
            type="file"
            accept={accept}
            multiple={false}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => deliver(e.target.files)}
          />
        </label>
      </div>
      <p className="text-center text-[10px] text-slate-400">
        {t("upload.sizeHint", {
          defaultValue: "PDF, JPG, PNG — up to {{limit}} MB{{premium}}",
          limit: limitMb,
          premium: isPremium ? " (Premium)" : "",
        })}
      </p>
    </div>
  );
}
