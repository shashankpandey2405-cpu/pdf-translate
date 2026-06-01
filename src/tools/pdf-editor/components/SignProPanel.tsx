import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSmoothSignaturePad, type PenThickness } from "@/hooks/useSmoothSignaturePad";
import { fileToSignaturePngDataUrl, typeSignatureToPngPreview, upscaleDataUrlPng } from "../signatureUtils";
import { withMinimumDuration, MIN_PROCESSING_DURATION_MS } from "@/tools/toolPipeline/registry";
import { autoRepairSignature } from "../signatureAutoRepair";

type Mode = "draw" | "type" | "upload";

const FONT_CHOICES = [
  { id: "great", css: `'Great Vibes', cursive` },
  { id: "dancing", css: `'Dancing Script', cursive` },
] as const;

interface Props {
  onAdd: (dataUrl: string) => void | Promise<void>;
  onClose: () => void;
  onError?: (message: string) => void;
  /** Blocks all modes while saving PDF. */
  disabled?: boolean;
  /** PDF page canvas not ready — blocks placing on document only. */
  placementDisabled?: boolean;
  /** Full-screen overlay (default) or inline in gear / tools rail. */
  variant?: "modal" | "embedded";
}

/** Signature workspace: smooth draw pad, typed fonts, upload with bg removal. */
export function SignProPanel({
  onAdd,
  onClose,
  onError,
  disabled = false,
  placementDisabled = false,
  variant = "modal",
}: Props) {
  const { t } = useTranslation();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("draw");
  const [typed, setTyped] = useState("");
  const [fontId, setFontId] = useState<(typeof FONT_CHOICES)[number]["id"]>("great");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [penThickness, setPenThickness] = useState<PenThickness>("medium");
  const padHeight = typeof window !== "undefined" && window.innerWidth < 640 ? 280 : 240;
  const { wrapRef, canvasRef, ready, hasInk, clear, isEmpty, exportSignaturePng, syncHasInk } =
    useSmoothSignaturePad({
      enabled: mode === "draw",
      heightCss: padHeight,
      thickness: penThickness,
    });

  useEffect(() => {
    if (!uploadBusy) {
      setUploadProgress(0);
      setUploadError(null);
      return;
    }
    const started = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setUploadProgress(Math.min(92, (elapsed / MIN_PROCESSING_DURATION_MS) * 92));
    }, 80);
    return () => window.clearInterval(id);
  }, [uploadBusy]);

  const fontCss = FONT_CHOICES.find((f) => f.id === fontId)?.css ?? FONT_CHOICES[0]!.css;

  async function placeOnDocument(dataUrl: string) {
    if (disabled) return;
    if (placementDisabled) {
      onError?.(t("signPdf.waitForPageLoad"));
      throw new Error(t("signPdf.waitForPageLoad"));
    }
    await onAdd(dataUrl);
    onClose();
  }

  async function commitDraw() {
    syncHasInk();
    if (isEmpty()) {
      onError?.(t("signPdf.drawTooSmall"));
      return;
    }
    if (disabled) return;
    try {
      const raw = exportSignaturePng();
      if (!raw) {
        onError?.(t("signPdf.drawTooSmall"));
        return;
      }
      const repaired = await autoRepairSignature(raw);
      const dataUrl = await upscaleDataUrlPng(repaired, 4);
      await placeOnDocument(dataUrl);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : t("signPdf.addFailed"));
    }
  }

  async function commitTyped() {
    if (disabled) return;
    const text = typed.trim() ? typed : t("pdfEditor.signPro.defaultName");
    try {
      await placeOnDocument(typeSignatureToPngPreview(text, fontCss, 3));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : t("signPdf.addFailed"));
    }
  }

  async function commitUpload(files: FileList | null) {
    if (disabled) return;
    const file = files?.[0];
    if (!file || uploadBusy) return;
    if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|heic|heif|gif|bmp)$/i.test(file.name)) {
      setUploadError(t("pdfEditor.signPro.uploadInvalidType", { defaultValue: "Please choose an image file (PNG, JPG, WebP, or HEIC)." }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Please use signature images up to 10MB so they embed cleanly in your PDF.");
      return;
    }
    setUploadBusy(true);
    setUploadError(null);
    try {
      const raw = await withMinimumDuration(fileToSignaturePngDataUrl(file, { whiteCutoff: 235 }), MIN_PROCESSING_DURATION_MS);
      const url = await upscaleDataUrlPng(raw, 3);
      setUploadProgress(100);
      await placeOnDocument(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to process the image. Please try a smaller file.";
      setUploadError(msg);
      onError?.(msg);
    } finally {
      setUploadBusy(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  }

  const typedForPreview = typed.trim() ? typed : t("pdfEditor.signPro.defaultName");

  const panel = (
      <div
        className={
          variant === "embedded"
            ? "relative w-full space-y-4"
            : "relative my-auto w-full max-w-lg max-h-[min(92dvh,720px)] overflow-y-auto overscroll-contain space-y-4 rounded-3xl border border-border bg-card p-6 shadow-2xl"
        }
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-base font-semibold text-foreground">{t("pdfEditor.signPro.title")}</span>
          <button type="button" className="px-2 text-lg leading-none text-muted-foreground hover:text-foreground" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="flex rounded-2xl border border-border bg-muted/50 p-1">
          {(["draw", "type", "upload"] as const).map((k) => (
            <button
              key={k}
              type="button"
              disabled={uploadBusy}
              onClick={() => setMode(k)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${mode === k ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t(`pdfEditor.signPro.${k}`)}
            </button>
          ))}
        </div>

        {mode === "draw" && (
          <div className="space-y-2">
            <div
              ref={wrapRef}
              className="relative w-full overflow-hidden rounded-2xl border border-[#e5dfd4] bg-[#fdfbf7] touch-none select-none"
              style={{
                touchAction: "none",
                minHeight: padHeight,
                backgroundImage:
                  "linear-gradient(#f3edeb 1px, transparent 1px), linear-gradient(90deg, #f3edeb 1px, transparent 1px)",
                backgroundSize: "22px 22px",
                backgroundPosition: "-1px -1px",
              }}
            >
              <canvas
                ref={canvasRef}
                className="block w-full cursor-crosshair rounded-2xl"
                style={{ touchAction: "none", height: padHeight }}
                aria-label={t("pdfEditor.signPro.padHint")}
              />
              {!ready ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                  {t("pdfEditor.signPro.padHint")}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">{t("pdfEditor.signPro.penSize", { defaultValue: "Pen" })}</span>
              <div className="flex items-center gap-1.5">
                {(["fine", "medium", "bold"] as const).map((thick) => (
                  <button
                    key={thick}
                    type="button"
                    onClick={() => setPenThickness(thick)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${penThickness === thick ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-muted"}`}
                    aria-label={thick}
                    title={thick === "fine" ? "Fine" : thick === "medium" ? "Medium" : "Bold"}
                  >
                    <span
                      className="rounded-full bg-foreground"
                      style={{
                        width: thick === "fine" ? 4 : thick === "medium" ? 7 : 11,
                        height: thick === "fine" ? 4 : thick === "medium" ? 7 : 11,
                      }}
                    />
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[10px] text-muted-foreground">{t("pdfEditor.signPro.autoSmooth", { defaultValue: "Auto-smoothed" })}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={clear} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
                {t("pdfEditor.signPro.clear")}
              </button>
              <button
                type="button"
                disabled={disabled || placementDisabled || !hasInk}
                onClick={() => void commitDraw()}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {t("pdfEditor.signPro.addToDocument")}
              </button>
            </div>
          </div>
        )}

        {mode === "type" && (
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t("pdfEditor.signPro.defaultName")}
              dir="auto"
            />
            <div className="flex gap-2">
              {FONT_CHOICES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontId(f.id)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-semibold ${fontId === f.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}
                  style={{ fontFamily: f.css.includes("Great") ? "Great Vibes, cursive" : "Dancing Script, cursive" }}
                >
                  Aa
                </button>
              ))}
            </div>
            <div className="flex justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-white px-6 py-8">
              <img alt={t("pdfEditor.signPro.previewAlt")} src={typeSignatureToPngPreview(typedForPreview, fontCss)} className="max-h-[100px]" />
            </div>
            <button type="button" disabled={disabled || placementDisabled} onClick={() => void commitTyped()} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-40">
              {t("pdfEditor.signPro.addToDocument")}
            </button>
          </div>
        )}

        {mode === "upload" && (
          <div className="relative space-y-3">
            {placementDisabled ? (
              <p className="rounded-xl border border-amber-400/30 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                {t("signPdf.waitForPageLoad")}
              </p>
            ) : null}
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.heic,.heif"
              className="sr-only"
              disabled={uploadBusy || disabled}
              onChange={(e) => void commitUpload(e.target.files)}
            />
            <button
              type="button"
              disabled={uploadBusy || disabled}
              onClick={() => uploadInputRef.current?.click()}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-12 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60 ${uploadBusy ? "pointer-events-none opacity-60" : ""}`}
            >
              <span className="text-sm font-medium text-foreground">{t("pdfEditor.signPro.uploadLabel")}</span>
              <span className="px-4 text-center text-xs text-muted-foreground">{t("pdfEditor.signPro.uploadSub")}</span>
            </button>
            {uploadError && !uploadBusy && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {uploadError}
              </div>
            )}
            {uploadBusy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-card/90 backdrop-blur-sm">
                <p className="text-sm font-medium text-foreground">{t("pdfEditor.signPro.processingPhoto")}</p>
                <div className="h-2 w-[min(100%,280px)] overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );

  if (variant === "embedded") return panel;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/65 px-3 py-6 backdrop-blur-sm">
      {panel}
    </div>
  );
}
