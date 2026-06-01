"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Camera,
  Download,
  Loader2,
  RotateCcw,
  RotateCw,
  Scan,
  Crop,
  Plus,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { ScannerCamera } from "@/components/document-scanner/ScannerCamera";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { scanImageFile } from "@/tools/ai-scanner/processScan";
import {
  type CropRect,
  type ScanFilterMode,
  blobToCanvas,
  cropCanvas,
  exportPagesAsPdf,
  loadImageToCanvas,
  renderPagePreview,
  rotateCanvas90,
} from "@/tools/student/documentScanner";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_PAGES = 20;

type ScanPage = {
  id: string;
  source: HTMLCanvasElement;
  filter: ScanFilterMode;
  crop: CropRect;
  cropEnabled: boolean;
};

function newPageId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function DocumentScanner() {
  const { t, i18n } = useTranslation();
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [cropMode, setCropMode] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [portraitFix, setPortraitFix] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [lastPdf, setLastPdf] = useState<{ blob: Blob; filename: string } | null>(null);
  const [stage, setStage] = useState<"scan" | "done">("scan");

  const activePage = pages.find((p) => p.id === activeId) ?? pages[0] ?? null;

  const revokeUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const updatePreview = useCallback(
    async (page: ScanPage) => {
      const rendered = await renderPagePreview(page.source, {
        crop: page.crop,
        cropEnabled: page.cropEnabled,
        filter: page.filter,
      });
      const url = rendered.toDataURL("image/jpeg", 0.88);
      setPreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) revokeUrl(prev);
        return url;
      });
    },
    [revokeUrl],
  );

  const refreshThumb = useCallback(async (page: ScanPage) => {
    const rendered = await renderPagePreview(page.source, {
      crop: page.crop,
      cropEnabled: page.cropEnabled,
      filter: page.filter,
    });
    const maxSide = 120;
    const scale = Math.min(1, maxSide / Math.max(rendered.width, rendered.height));
    const thumb = document.createElement("canvas");
    thumb.width = Math.round(rendered.width * scale);
    thumb.height = Math.round(rendered.height * scale);
    thumb.getContext("2d")?.drawImage(rendered, 0, 0, thumb.width, thumb.height);
    const dataUrl = thumb.toDataURL("image/jpeg", 0.75);
    setThumbUrls((prev) => ({ ...prev, [page.id]: dataUrl }));
  }, []);

  useEffect(() => {
    if (!activePage) {
      setPreviewUrl(null);
      return;
    }
    void updatePreview(activePage);
  }, [activePage, activePage?.crop, activePage?.filter, activePage?.cropEnabled, updatePreview]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) revokeUrl(previewUrl);
    };
  }, [previewUrl, revokeUrl]);

  const patchPage = useCallback(
    (id: string, patch: Partial<ScanPage>) => {
      setPages((list) => {
        const next = list.map((p) => (p.id === id ? { ...p, ...patch } : p));
        const updated = next.find((p) => p.id === id);
        if (updated) void refreshThumb(updated);
        return next;
      });
    },
    [refreshThumb],
  );

  const addCanvasPage = useCallback(
    (canvas: HTMLCanvasElement) => {
      const id = newPageId();
      const page: ScanPage = {
        id,
        source: canvas,
        filter: autoEnhance ? "enhance" : "color",
        crop: { x: 0.02, y: 0.02, w: 0.96, h: 0.96 },
        cropEnabled: false,
      };
      setPages((list) => {
        if (list.length >= MAX_PAGES) return list;
        return [...list, page];
      });
      setActiveId(id);
      setStage("scan");
      void refreshThumb(page);
    },
    [autoEnhance, refreshThumb],
  );

  const ingestFile = useCallback(
    async (file: File) => {
      if (pages.length >= MAX_PAGES) {
        setError(t("docScanner.pageLimit", { max: MAX_PAGES, defaultValue: "Maximum {{max}} pages per document." }));
        return;
      }
      setBusy(true);
      setError(null);
      try {
        let canvas: HTMLCanvasElement;
        if (autoDetect) {
          const blob = await scanImageFile(
            file,
            { perspective: true, enhance: autoEnhance, portrait: portraitFix },
            undefined,
          );
          canvas = await blobToCanvas(blob);
        } else {
          canvas = (await loadImageToCanvas(file)).canvas;
        }
        addCanvasPage(canvas);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("docScanner.loadFailed", { defaultValue: "Could not process image." }));
      } finally {
        setBusy(false);
      }
    },
    [addCanvasPage, autoDetect, autoEnhance, portraitFix, pages.length, t],
  );

  const removePage = (id: string) => {
    setPages((list) => {
      const next = list.filter((p) => p.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
    setThumbUrls((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const resetAll = () => {
    setPages([]);
    setActiveId(null);
    setPreviewUrl(null);
    setThumbUrls({});
    setCropMode(false);
    setError(null);
    setLastPdf(null);
    setStage("scan");
  };

  async function exportPdf() {
    if (!pages.length) return;
    setBusy(true);
    setError(null);
    try {
      const rendered = await Promise.all(
        pages.map((p) =>
          renderPagePreview(p.source, { crop: p.crop, cropEnabled: p.cropEnabled, filter: p.filter }),
        ),
      );
      const { bytes, filename } = await exportPagesAsPdf(rendered);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setLastPdf({ blob, filename });
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("docScanner.exportFailed", { defaultValue: "PDF export failed." }));
    } finally {
      setBusy(false);
    }
  }

  const settingsPanel = activePage ? (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("docScanner.scanSettings", { defaultValue: "Scan settings" })}
      </p>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <Label htmlFor="auto-detect" className="text-sm">
          {t("docScanner.autoDetect", { defaultValue: "Auto edge detect" })}
        </Label>
        <Switch id="auto-detect" checked={autoDetect} onCheckedChange={setAutoDetect} />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <Label htmlFor="auto-enhance" className="text-sm">
          {t("docScanner.autoEnhance", { defaultValue: "Magic enhance on capture" })}
        </Label>
        <Switch id="auto-enhance" checked={autoEnhance} onCheckedChange={setAutoEnhance} />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <Label htmlFor="portrait-fix" className="text-sm">
          {t("docScanner.portraitFix", { defaultValue: "Portrait orientation" })}
        </Label>
        <Switch id="portrait-fix" checked={portraitFix} onCheckedChange={setPortraitFix} />
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("docScanner.filter", { defaultValue: "Filter" })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { id: "enhance" as const, label: t("docScanner.filterMagic", { defaultValue: "Magic" }), icon: Sparkles },
            { id: "bw" as const, label: t("docScanner.filterBw", { defaultValue: "B&W" }), icon: Scan },
            { id: "grayscale" as const, label: t("docScanner.filterGray", { defaultValue: "Gray" }), icon: ImageIcon },
            { id: "color" as const, label: t("docScanner.filterColor", { defaultValue: "Color" }), icon: FileText },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => patchPage(activePage.id, { filter: f.id })}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold",
              activePage.filter === f.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
            )}
          >
            <f.icon className="h-4 w-4" />
            {f.label}
          </button>
        ))}
      </div>

      {cropMode ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {(["x", "y", "w", "h"] as const).map((key) => (
            <label key={key} className="block text-[10px] font-semibold uppercase text-muted-foreground">
              Crop {key}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={activePage.crop[key]}
                onChange={(e) =>
                  patchPage(activePage.id, {
                    crop: { ...activePage.crop, [key]: Number(e.target.value) },
                    cropEnabled: true,
                  })
                }
                className="mt-1 h-3 w-full accent-primary"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => {
              const cropped = cropCanvas(activePage.source, activePage.crop);
              setPages((list) =>
                list.map((p) =>
                  p.id === activePage.id ? { ...p, source: cropped, cropEnabled: false, crop: { x: 0, y: 0, w: 1, h: 1 } } : p,
                ),
              );
              setCropMode(false);
            }}
            className="sm:col-span-2 min-h-[44px] rounded-xl bg-primary text-sm font-semibold text-white"
          >
            {t("docScanner.applyCrop", { defaultValue: "Apply crop" })}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const rotated = rotateCanvas90(activePage.source, "ccw");
              patchPage(activePage.id, { source: rotated });
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const rotated = rotateCanvas90(activePage.source, "cw");
              patchPage(activePage.id, { source: rotated });
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCropMode(true);
              patchPage(activePage.id, { cropEnabled: true });
            }}
            className={cn(
              "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-medium",
              cropMode ? "border-primary bg-primary/10" : "border-border bg-card",
            )}
          >
            <Crop className="h-4 w-4" />
            {t("docScanner.crop", { defaultValue: "Crop" })}
          </button>
          <button
            type="button"
            onClick={() => removePage(activePage.id)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-destructive/40 px-3 text-xs font-medium text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  ) : null;

  const captureActions = (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => setShowCamera(true)}
        className={cn(TOOL_PRIMARY_BTN, "flex-1")}
      >
        <Camera className="h-5 w-5" />
        {t("docScanner.openCamera", { defaultValue: "Open camera" })}
      </button>
      <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold">
        <Plus className="h-5 w-5" />
        {t("docScanner.addPage", { defaultValue: "Add page" })}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void ingestFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );

  const workspace = (
    <>
      {busy ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("docScanner.processing", { defaultValue: "Processing scan…" })}
        </div>
      ) : null}

      {!pages.length ? (
        <div className="space-y-4">
          <ToolUploadSlot
            files={[]}
            onFiles={(f) => {
              const file = f[0];
              if (file) void ingestFile(file);
            }}
            accept="image/*"
            label={t("docScanner.dropLabel", { defaultValue: "Upload or capture a document" })}
            sublabel={t("docScanner.dropSub", { defaultValue: "Camera, JPG, PNG, or HEIC — up to 20 pages" })}
          />
          {captureActions}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-100 dark:bg-slate-900">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="max-h-[min(55vh,480px)] w-full object-contain" />
            ) : null}
            {cropMode && activePage ? (
              <div
                className="pointer-events-none absolute border-2 border-primary bg-primary/10"
                style={{
                  left: `${activePage.crop.x * 100}%`,
                  top: `${activePage.crop.y * 100}%`,
                  width: `${activePage.crop.w * 100}%`,
                  height: `${activePage.crop.h * 100}%`,
                }}
              />
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {pages.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={cn(
                  "relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                  activeId === p.id ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                {thumbUrls[p.id] ? (
                  <img src={thumbUrls[p.id]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">{idx + 1}</span>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[9px] font-bold text-white">
                  {idx + 1}
                </span>
              </button>
            ))}
            {pages.length < MAX_PAGES ? (
              <label className="flex h-20 w-14 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground">
                <Plus className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void ingestFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : null}
          </div>

          {captureActions}
        </div>
      )}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </>
  );

  const exportBtn =
    pages.length > 0 ? (
      <button
        type="button"
        disabled={busy}
        onClick={() => void exportPdf()}
        className={TOOL_PRIMARY_BTN}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        {t("docScanner.exportPdf", { defaultValue: "Save PDF" })} ({pages.length})
      </button>
    ) : null;

  const desktopExperience = (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-6xl gap-6 px-4 py-6">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-foreground">{t("docScanner.title", { defaultValue: "Document Scanner" })}</h1>
          {pages.length > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void exportPdf()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t("docScanner.exportPdf", { defaultValue: "Save PDF" })}
            </button>
          ) : null}
        </div>
        {workspace}
        {stage === "done" && lastPdf ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">{t("docScanner.ready", { defaultValue: "PDF ready" })}</p>
            <button
              type="button"
              onClick={() => void safeDownloadBlob(lastPdf.blob, lastPdf.filename)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {t("docScanner.downloadPdf", { defaultValue: "Download PDF" })}
            </button>
          </div>
        ) : null}
      </div>
      {activePage ? (
        <aside className="hidden w-72 shrink-0 overflow-y-auto rounded-2xl border border-border bg-card p-4 lg:block">
          {settingsPanel}
        </aside>
      ) : null}
    </div>
  );

  const mobilePage = (
    <MobileToolLayout
      slug="document-scanner"
      toolLabel={t("docScanner.title", { defaultValue: "Document Scanner" })}
      title={t("docScanner.title", { defaultValue: "Document Scanner" })}
      settingsPanel={settingsPanel}
      autoOpenSettings={Boolean(activePage)}
      processButton={exportBtn}
      postProcessPanel={
        lastPdf ? (
          <MobilePostProcessPanel
            currentSlug="document-scanner"
            onDownload={() => void safeDownloadBlob(lastPdf.blob, lastPdf.filename)}
            onShare={() => void shareBlob(lastPdf.blob, lastPdf.filename)}
            onProcessAnother={resetAll}
            downloadLabel={t("docScanner.downloadPdf", { defaultValue: "Download PDF" })}
          />
        ) : undefined
      }
    >
      {workspace}
    </MobileToolLayout>
  );

  return (
    <ToolRenderErrorBoundary onReset={resetAll}>
      <ToolSEO
        title="Document Scanner — Cam Scanner Style"
        description="Multi-page document scanner with camera, auto edge detection, magic enhance, B&W filters, crop, and PDF export. 100% private in your browser."
        slug="document-scanner"
        lang={i18n.language}
      />
      {showCamera ? <ScannerCamera onCapture={(f) => void ingestFile(f)} onClose={() => setShowCamera(false)} /> : null}
      <ToolPageSplit desktop={desktopExperience} mobile={mobilePage} />
    </ToolRenderErrorBoundary>
  );
}
