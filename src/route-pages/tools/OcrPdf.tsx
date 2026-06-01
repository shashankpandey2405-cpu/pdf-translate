"use client";

import { useEffect, useState } from "react";
import { ScanText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SinglePdfToolShell } from "@/components/tools/SinglePdfToolShell";
import { content } from "@/tools/ocr-pdf/content";
import { usePremium } from "@/context/PremiumContext";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { ConversionError } from "@/tools/conversions/ConversionError";
import { isClientQaModeActive } from "@/lib/qa/isQaMode";
import { OcrLanguageSelect } from "@/components/ocr/OcrLanguageSelect";
import { ToolModalSettingsBlock } from "@/components/tools/ToolModalSettingsBlock";
import { normalizeOcrLanguage } from "@/lib/ocr/tesseractLanguages";
import { cn } from "@/lib/utils";
export type OcrMode = "fast" | "balanced" | "accurate" | "clean_scan" | "ultra";

export default function OcrPdf() {
  const { t, i18n } = useTranslation();

  const [ocrLanguage, setOcrLanguage] = useState("eng");
  const [autoLanguage, setAutoLanguage] = useState(true);
  const [deskew, setDeskew] = useState(true);
  const [ocrClean, setOcrClean] = useState(false);
  const [ocrMode, setOcrMode] = useState<OcrMode>("accurate");
  const [ocrPreprocess, setOcrPreprocess] = useState(true);
  const [ocrPreserveColors, setOcrPreserveColors] = useState(true);

  useEffect(() => {
    if (ocrMode === "clean_scan") {
      setOcrClean(true);
      setOcrPreprocess(true);
      setDeskew(true);
    }
    if (ocrMode === "ultra") {
      setOcrPreprocess(true);
    }
  }, [ocrMode]);

  const langCode = normalizeOcrLanguage(ocrLanguage);

  return (
    <>
      <SinglePdfToolShell
        cloudProcessingOnly
        supportsEnhanced
        slug={content.slug}
        toolLabel="OCR PDF"
        title={content.hero.title}
        subtitle={content.hero.subtitle}
        icon={<ScanText className="w-5 h-5 text-emerald-600" />}
        iconClassName="bg-emerald-50"
        steps={content.steps}
        lang={i18n.language}
        cloudOptions={() => ({
          ocrLanguage: autoLanguage ? "eng" : langCode,
          ocrAutoLanguage: autoLanguage,
          ocrDeskew: deskew,
          ocrClean,
          ocrMode,
          ocrPreprocess,
          ocrPreserveColors,
          ocrPreprocessScale: 2.0,
        })}
        configurePanel={() => (
          <ToolModalSettingsBlock
            title={t("ocr.optionsTitle", { defaultValue: "OCR options" })}
          >
          <OcrConfigurePanel
            variant="modal"
            ocrLanguage={langCode}
            setOcrLanguage={setOcrLanguage}
            autoLanguage={autoLanguage}
            setAutoLanguage={setAutoLanguage}
            deskew={deskew}
            setDeskew={setDeskew}
            ocrClean={ocrClean}
            setOcrClean={setOcrClean}
            ocrMode={ocrMode}
            setOcrMode={setOcrMode}
            ocrPreprocess={ocrPreprocess}
            setOcrPreprocess={setOcrPreprocess}
            ocrPreserveColors={ocrPreserveColors}
            setOcrPreserveColors={setOcrPreserveColors}
          />
          </ToolModalSettingsBlock>
        )}
        onProcess={async () => {
          throw new ConversionError(
            "UNSUPPORTED",
            "Browser OCR is not available for this tool.",
          );
        }}
      />
    </>
  );
}

export function OcrConfigurePanel({
  ocrLanguage,
  setOcrLanguage,
  autoLanguage,
  setAutoLanguage,
  deskew,
  setDeskew,
  ocrClean,
  setOcrClean,
  ocrMode,
  setOcrMode,
  ocrPreprocess,
  setOcrPreprocess,
  ocrPreserveColors,
  setOcrPreserveColors,
  variant = "sidebar",
}: {
  ocrLanguage: string;
  setOcrLanguage: (v: string) => void;
  autoLanguage: boolean;
  setAutoLanguage: (v: boolean) => void;
  deskew: boolean;
  setDeskew: (v: boolean) => void;
  ocrClean: boolean;
  setOcrClean: (v: boolean) => void;
  ocrMode: OcrMode;
  setOcrMode: (v: OcrMode) => void;
  ocrPreprocess: boolean;
  setOcrPreprocess: (v: boolean) => void;
  ocrPreserveColors: boolean;
  setOcrPreserveColors: (v: boolean) => void;
  variant?: "sidebar" | "modal";
}) {
  const { t } = useTranslation();
  const inModal = variant === "modal";
  const { isSignedIn } = usePremium();
  const { usage, cloudInfraReady, cloudInfraLoading, cloudInfraMessage } = useProcessingMode();
  const qaMode = isClientQaModeActive();
  const quotaExhausted =
    !qaMode &&
    usage?.enabled &&
    usage.enhancedRemaining !== undefined &&
    usage.enhancedRemaining <= 0;

  return (
    <div className={inModal ? "space-y-2.5" : "space-y-4"}>
      {!inModal && !cloudInfraLoading && !cloudInfraReady ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
          {cloudInfraMessage ??
            t("ocr.cloudSetupHint", {
              defaultValue:
                "Cloud OCR needs Redis + storage on the server. Set env vars on Vercel and ensure the OCR worker is running on Railway.",
            })}
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="text-muted-foreground">
          {t("ocr.qualityMode", { defaultValue: "Quality mode" })}
        </span>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={ocrMode}
          onChange={(e) => setOcrMode(e.target.value as OcrMode)}
        >
          <option value="accurate">
            {t("ocr.modeAccurate", { defaultValue: "High accuracy — straightens & best text layer (recommended)" })}
          </option>
          <option value="balanced">
            {t("ocr.modeBalanced", { defaultValue: "Balanced — faster, good for clean scans" })}
          </option>
          <option value="clean_scan">
            {t("ocr.modeCleanScan", { defaultValue: "Clean scan — noisy / skewed pages" })}
          </option>
          <option value="ultra">
            {t("ocr.modeUltra", { defaultValue: "Ultra — hardest scans (cloud premium engine)" })}
          </option>
          <option value="fast">{t("ocr.modeFast", { defaultValue: "Fast — clean digital scans" })}</option>
        </select>
      </label>

      {!inModal && ocrMode === "ultra" ? (
        <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/30 px-3 py-2 leading-relaxed">
          {t("ocr.ultraHint", {
            defaultValue:
              "Ultra runs our strongest cloud OCR stack (PaddleOCR when installed on the worker, otherwise high-accuracy Tesseract). Best for difficult scans.",
          })}
        </p>
      ) : !inModal ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("ocr.accuracyNote", {
            defaultValue:
              "Output is a searchable PDF — select and copy text in any PDF viewer. For full editing, use PDF to Word after OCR. Keep deskew + preprocess on for crooked scans.",
          })}
        </p>
      ) : null}

      <label
        className={cn(
          "flex items-center gap-2 font-medium",
          inModal ? "text-xs" : "text-sm",
        )}
      >
        <input
          type="checkbox"
          checked={autoLanguage}
          onChange={(e) => setAutoLanguage(e.target.checked)}
        />
        {t("ocr.autoLanguage", { defaultValue: "Auto-detect document language (recommended)" })}
      </label>

      {!autoLanguage ? (
        <OcrLanguageSelect
          value={ocrLanguage}
          onChange={(code) => setOcrLanguage(code)}
          disabled={autoLanguage}
        />
      ) : null}

      <div className={inModal ? "grid gap-2 sm:grid-cols-1" : "space-y-2"}>
        {ocrMode !== "ultra" ? (
          <>
            <label className={cn("flex items-center gap-2", inModal ? "text-xs" : "text-sm")}>
              <input type="checkbox" checked={deskew} onChange={(e) => setDeskew(e.target.checked)} />
              {t("ocr.deskew", { defaultValue: "Deskew scanned pages" })}
            </label>
            <label className={cn("flex items-center gap-2", inModal ? "text-xs" : "text-sm")}>
              <input type="checkbox" checked={ocrClean} onChange={(e) => setOcrClean(e.target.checked)} />
              {t("ocr.cleanBackground", { defaultValue: "Clean background (remove speckle)" })}
            </label>
          </>
        ) : null}

        <label className={cn("flex items-center gap-2 cursor-pointer", inModal ? "text-xs" : "text-sm")}>
          <input
            type="checkbox"
            checked={ocrPreserveColors}
            onChange={(e) => setOcrPreserveColors(e.target.checked)}
          />
          {t("ocr.preserveColors", {
            defaultValue: "Preserve original colors (recommended for permits & forms)",
          })}
        </label>
        <label className={cn("flex items-center gap-2 cursor-pointer", inModal ? "text-xs" : "text-sm")}>
          <input
            type="checkbox"
            checked={ocrPreprocess}
            onChange={(e) => setOcrPreprocess(e.target.checked)}
          />
          {t("ocr.preprocess", {
            defaultValue: "Light scan enhancement before OCR (contrast only, not grayscale)",
          })}
        </label>
      </div>
      {ocrMode === "clean_scan" ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {t("ocr.cleanScanColorWarning", {
            defaultValue: "Clean scan mode may change background colors (removes speckle).",
          })}
        </p>
      ) : null}

      {!inModal ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("ocr.footer", {
            defaultValue: "Searchable PDF output · secure cloud processing.",
          })}
          {!isSignedIn ? (
            <span className="mt-1 block font-medium text-foreground">
              {t("ocr.signInToStart", {
                defaultValue: "Continue with Google to run Turbo Cloud OCR when you're ready.",
              })}
            </span>
          ) : cloudInfraReady ? (
            <span className="mt-1 block font-medium text-emerald-600 dark:text-emerald-400">
              {t("ocr.cloudReady", { defaultValue: "Cloud OCR is online." })}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
