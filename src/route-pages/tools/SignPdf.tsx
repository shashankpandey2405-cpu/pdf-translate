import { useState, useCallback, useRef, useMemo, useEffect, lazy, Suspense } from "react";
import { EditorDesktopChrome } from "@/components/desktop/EditorDesktopChrome";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Signature,
} from "lucide-react";
import DropZone from "@/components/DropZone";
import type { PDFEditorCanvasHandle } from "@/components/PDFEditorCanvas";

const PDFEditorCanvas = lazy(() =>
  import("@/components/PDFEditorCanvas").then((mod) => ({ default: mod.PDFEditorCanvas })),
);
import { usePremium } from "@/context/PremiumContext";
import {
  type Annotation,
  type CanvasDim,
  type ImageAnnotation,
  saveAnnotationsToPDF,
  nextZIndexForPage,
  genId,
} from "@/tools/pdf-editor/logic";
import dynamic from "next/dynamic";

const SignProPanel = dynamic(
  () => import("@/tools/pdf-editor/components/SignProPanel").then((m) => ({ default: m.SignProPanel })),
  { ssr: false, loading: () => null },
);
import { measureSignaturePlacement, waitForEditorPageDim } from "@/tools/pdf-editor/signatureUtils";
import { validateSignedPdfStamps } from "@/tools/pdf-editor/signatureSaveValidation";
import { toast } from "sonner";
import { getPDFPageCount, renderAllPages } from "@/components/PDFThumbnail";
import ToolSEO from "@/components/ToolSEO";
import { logToolError, logToolSuccess } from "@/utils/logger";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { mergeAnnotationsPreservingImageExportDim } from "@/tools/pdf-editor/annotationExportDim";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobileToolOptionsSheet } from "@/components/mobile/MobileToolOptionsSheet";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { useTranslation } from "react-i18next";
import { getPdfViewportMaxScale } from "@/lib/pdfRenderBudget";
import { useProcess } from "@/context/ProcessContext";
import { DocumentAuditorPanel } from "@/components/trustShield/DocumentAuditorPanel";
import { TrustShieldPrivacyToggle } from "@/components/trustShield/TrustShieldPrivacyToggle";
import { TrustShieldPrivacyNotice } from "@/components/trustShield/TrustShieldPrivacyNotice";
import { TrustShieldBadge } from "@/components/trustShield/TrustShieldBadge";
import {
  HardLockDownloadToggle,
  useHardLockEnabled,
} from "@/components/trustShield/HardLockDownloadToggle";
import { getHardLockedFilename } from "@/lib/trustShield/hardLockPdf";
import { useWorkspaceHistory } from "@/context/WorkspaceHistoryContext";
import { persistWorkspaceOutput } from "@/lib/workspaceHistory/persistOutput";
import { useWorkspaceResume } from "@/hooks/useWorkspaceResume";

const hideEditorAds = (stage: "upload" | "edit" | "saving") => stage !== "upload";

export default function SignPdf() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [stage, setStage] = useState<"upload" | "edit" | "saving">("upload");
  const [saveProgress, setSaveProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSignPanel, setShowSignPanel] = useState(false);
  const [signOptionsOpen, setSignOptionsOpen] = useState(false);
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [fitWidthNonce, setFitWidthNonce] = useState(0);
  const [lastResult, setLastResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [pageCanvasReady, setPageCanvasReady] = useState(false);
  const pdfScaleCap = useMemo(() => getPdfViewportMaxScale(), []);
  const dimsRef = useRef<Record<number, CanvasDim>>({});
  const pdfCanvasRef = useRef<PDFEditorCanvasHandle>(null);
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const { canUse } = usePremium();
  const { setProcessedFile } = useProcess();
  const { saveSession } = useWorkspaceHistory();
  const {
    hardLock,
    confirmOpen,
    requestToggle,
    confirmEnable,
    cancelEnable,
    applyHardLock,
  } = useHardLockEnabled();

  const resolvePageDim = useCallback(
    (pageIndex: number): CanvasDim | null =>
      dimsRef.current[pageIndex] ?? pdfCanvasRef.current?.getCanvasDim() ?? null,
    [],
  );

  const handleDimUpdate = useCallback((page: number, dim: CanvasDim) => {
    dimsRef.current[page] = dim;
    if (page === currentPageRef.current - 1) setPageCanvasReady(true);
  }, []);

  useEffect(() => {
    setPageCanvasReady(false);
    const page = currentPage - 1;
    if (dimsRef.current[page]) setPageCanvasReady(true);
  }, [currentPage, file]);

  const title = t("tools.sign-pdf.label");
  const subtitle = t("tools.sign-pdf.desc");

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      const check = canUse(1, f.size / (1024 * 1024), "sign-pdf");
      if (!check.allowed) {
        setError(check.reason ?? t("pdfEditor.premiumLimitFallback"));
        logToolError("sign-pdf", "upload_premium_blocked", new Error(check.reason ?? "blocked"));
        return;
      }
      setError(null);
      setFile(f);
      setAnnotations([]);
      setSelectedAnnId(null);
      setCurrentPage(1);
      setZoomFactor(1);
      setFitWidthNonce((n) => n + 1);
      setStage("edit");
      void getPDFPageCount(f)
        .then(setPageCount)
        .catch(() => setPageCount(1));
      void renderAllPages(f, 0.3)
        .then(setThumbs)
        .catch(() => setThumbs([]));
      persistWorkspaceOutput(saveSession, {
        filename: f.name,
        toolSlug: "sign-pdf",
        toolLabel: "Sign PDF",
        data: f,
      });
    },
    [canUse, saveSession, t],
  );

  useWorkspaceResume({
    toolSlug: "sign-pdf",
    enabled: stage === "upload",
    onResume: (f) => handleFiles([f]),
  });

  const resetSignWorkflow = useCallback(() => {
    dimsRef.current = {};
    setStage("upload");
    setFile(null);
    setPageCount(0);
    setCurrentPage(1);
    setThumbs([]);
    setAnnotations([]);
    setSaveProgress(0);
    setError(null);
    setShowSignPanel(false);
    setSelectedAnnId(null);
    setZoomFactor(1);
    setFitWidthNonce((n) => n + 1);
    setLastResult(null);
  }, []);

  function pushAnnotations(next: Annotation[]) {
    setAnnotations((prev) => {
      const page = currentPage - 1;
      const dim = dimsRef.current[page];
      return mergeAnnotationsPreservingImageExportDim(prev, next, page, dim);
    });
  }

  const handleAddSignature = useCallback(
    async (signatureDataUrl: string) => {
      try {
        if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/")) {
          throw new Error("Invalid signature data");
        }

        const page = currentPage - 1;
        const exportDim = await waitForEditorPageDim(() => resolvePageDim(page));
        if (!exportDim) {
          const msg = t("signPdf.waitForPageLoad");
          setError(msg);
          throw new Error(msg);
        }

        const { w, h } = await measureSignaturePlacement(signatureDataUrl);
        const dim = exportDim;
        const margin = 24;
        const x = Math.max(margin, (dim.width - w) / 2);
        const y = Math.max(margin, dim.height * 0.72 - h);

        const newId = genId();
        setAnnotations((current) => {
          const ann: ImageAnnotation = {
            id: newId,
            type: "image",
            page,
            x,
            y,
            w,
            h,
            imageData: signatureDataUrl,
            opacity: 1,
            rotationDeg: 0,
            exportDim: { ...exportDim },
            zIndex: nextZIndexForPage(current, page),
          };
          return mergeAnnotationsPreservingImageExportDim(current, [...current, ann], page, exportDim);
        });
        // Set selected after annotations to avoid race condition
        requestAnimationFrame(() => setSelectedAnnId(newId));
        setError(null);
        setShowSignPanel(false);
        setSignOptionsOpen(false);
        toast.success(t("signPdf.addedSuccess"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("signPdf.addFailed");
        setError(msg);
        logToolError("sign-pdf", "add_signature_failed", err);
        throw err;
      }
    },
    [currentPage, resolvePageDim, t],
  );

  function removeSelected() {
    if (!selectedAnnId) return;
    pushAnnotations(annotations.filter((a) => a.id !== selectedAnnId));
    setSelectedAnnId(null);
  }

  function clearSignaturesOnPage() {
    pushAnnotations(annotations.filter((a) => a.page !== currentPage - 1));
    setSelectedAnnId(null);
  }

  async function handleDownload() {
    if (!file) return;

    const mergedDims = { ...dimsRef.current };
    const live = pdfCanvasRef.current?.getCanvasDim();
    if (live) mergedDims[currentPage - 1] = live;

    const sigOnly = annotations.filter((a): a is ImageAnnotation => a.type === "image");
    for (const a of sigOnly) {
      const dim = a.exportDim ?? mergedDims[a.page];
      if (!dim) {
        setError(t("signPdf.exportMissingDim", { page: a.page + 1 }));
        return;
      }
    }

    setStage("saving");
    setSaveProgress(0);
    let timer: number | null = null;
    try {
      await runTieredThenCleanup(
        [file],
        {
          onProgress: (u, t) => {
            const safe = Math.max(t, 1);
            setSaveProgress(Math.round((u / safe) * 55));
          },
        },
        async () => {
          timer = window.setInterval(() => setSaveProgress((p) => Math.min(p + 8, 92)), 200);
          try {
            const sigOnly = annotations.filter((a): a is ImageAnnotation => a.type === "image");
            const result = await saveAnnotationsToPDF(file, sigOnly, mergedDims);
            const validation = await validateSignedPdfStamps(result, sigOnly, mergedDims);
            if (!validation.ok) {
              throw new Error(validation.message);
            }
            window.clearInterval(timer);
            timer = null;
            const finalBytes = await applyHardLock(result, (page, total) => {
              setSaveProgress(60 + Math.round((page / Math.max(total, 1)) * 35));
            });
            setSaveProgress(100);
            const signedName = file.name.replace(/\.pdf$/i, "") + "_signed.pdf";
            const filename = hardLock ? getHardLockedFilename(signedName) : signedName;
            const blob = new Blob([finalBytes as BlobPart], { type: "application/pdf" });
            setLastResult({ blob, filename });
            setProcessedFile({
              blob,
              filename,
              tool: "Sign PDF",
              toolSlug: "sign-pdf",
              originalSize: file.size,
              processedSize: finalBytes.length,
            });
            persistWorkspaceOutput(saveSession, {
              filename,
              toolSlug: "sign-pdf",
              toolLabel: "Sign PDF",
              data: finalBytes,
            });
            logToolSuccess("sign-pdf", { flow: "signed_pdf_download" });
            setStage("edit");
            setSaveProgress(0);
          } finally {
            if (timer !== null) window.clearInterval(timer);
            timer = null;
          }
        },
      );
    } catch (err) {
      logToolError("sign-pdf", "save_signed_pdf", err, { recoverable: true });
      setError(err instanceof Error ? err.message : t("pdfEditor.errors.savePdfFailed"));
      setStage("edit");
    }
  }

  const pageSigCount = annotations.filter((a) => a.type === "image" && a.page === currentPage - 1).length;

  if (stage === "upload") {
    return (
      <>
        <div className="mx-auto hidden max-w-5xl px-4 py-10 sm:px-6 lg:block">
          <ToolSEO title={title} description={subtitle} slug="sign-pdf" lang={i18n.language} />
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <DropZone onFiles={handleFiles} multiple={false} label={t("signPdf.dropLabel")} sublabel={t("signPdf.dropSub")} />
        </div>
        <MobileToolLayout slug="sign-pdf" toolLabel={title} title={title} workflowStep="upload">
          <ToolSEO title={title} description={subtitle} slug="sign-pdf" lang={i18n.language} />
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <ToolUploadSlot
            files={[]}
            onFiles={handleFiles}
            multiple={false}
            label={t("signPdf.dropLabel")}
            sublabel={t("signPdf.dropSub")}
          />
        </MobileToolLayout>
      </>
    );
  }

  return (
    <ToolRenderErrorBoundary onReset={resetSignWorkflow}>
    <EditorDesktopChrome activeSlug="sign-pdf">
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30"
      data-testid="sign-pdf-workspace"
    >
      <ToolSEO title={title} description={subtitle} slug="sign-pdf" lang={i18n.language} />

      <div className={`flex min-h-0 flex-1 overflow-hidden lg:flex-row ${isRTL ? "lg:flex-row-reverse" : ""}`}>
        {/* Thumbnails */}
        <aside
          className={`hidden w-[168px] shrink-0 overflow-y-auto border-border bg-card lg:block ${isRTL ? "border-l" : "border-r"}`}
        >
          <div className="p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("pdfEditor.pagesHeading")}</p>
            <div className="space-y-2">
              {thumbs.length > 0
                ? thumbs.map((thumb, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative w-full overflow-hidden rounded-xl border-2 transition-all ${currentPage === i + 1 ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"}`}
                    >
                      <img src={thumb} alt="" className="w-full object-contain" />
                      <span className="absolute bottom-0 left-0 right-0 bg-white/90 py-0.5 text-center text-[10px] font-medium">{i + 1}</span>
                    </button>
                  ))
                : Array.from({ length: Math.min(pageCount, 8) }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
                  ))}
            </div>
            {file && <DocumentAuditorPanel file={file} className="mt-4" />}
          </div>
        </aside>

        {/* Mobile thumbs */}
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-card px-2 py-2 lg:hidden">
          {thumbs.map((thumb, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentPage(i + 1)}
              className={`relative h-20 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${currentPage === i + 1 ? "border-primary" : "border-border"}`}
            >
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-40 flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-border bg-card px-2 py-2 sm:h-12 sm:min-h-12 sm:px-4 sm:py-0">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <ToolWorkflowActions
                onReset={resetSignWorkflow}
                resetDisabled={stage === "saving"}
                className="border-border max-sm:w-full max-sm:border-b max-sm:border-border max-sm:pb-2 sm:border-r sm:pr-2 sm:mr-1"
              />
              <TrustShieldBadge compact className="hidden sm:inline-flex" />
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:p-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-foreground sm:text-sm">
                {t("pdfEditor.pageNofM", { current: currentPage, total: pageCount || "…" })}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted disabled:opacity-40 sm:min-h-0 sm:min-w-0 sm:p-1.5"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="mx-1 flex items-center gap-0.5 border-border sm:mx-2 sm:border-x sm:px-2">
                <button
                  type="button"
                  title={t("pdfEditor.zoomOut")}
                  onClick={() => setZoomFactor((z) => Math.max(0.5, Math.round((z - 0.15) * 100) / 100))}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted sm:min-h-0 sm:min-w-0 sm:p-1.5"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[2.75rem] text-center text-[11px] font-semibold tabular-nums text-muted-foreground sm:text-xs">
                  {t("pdfEditor.zoomPercent", { pct: Math.round(zoomFactor * 100) })}
                </span>
                <button
                  type="button"
                  title={t("pdfEditor.zoomIn")}
                  onClick={() => setZoomFactor((z) => Math.min(3, Math.round((z + 0.15) * 100) / 100))}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted sm:min-h-0 sm:min-w-0 sm:p-1.5"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title={t("pdfEditor.fitWidth")}
                  onClick={() => {
                    setZoomFactor(1);
                    setFitWidthNonce((n) => n + 1);
                  }}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted sm:min-h-0 sm:min-w-0 sm:p-1.5"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex max-w-full flex-wrap items-center justify-end gap-1 sm:gap-2">
              <button
                type="button"
                data-testid="sign-pdf-add-signature"
                disabled={!pageCanvasReady}
                onClick={() => {
                  setError(null);
                  if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
                    setSignOptionsOpen(true);
                  } else {
                    setShowSignPanel(true);
                  }
                }}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-primary/40 bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm"
              >
                <Signature className="h-4 w-4 shrink-0" />
                {t("signPdf.addSignature")}
              </button>
              {selectedAnnId && (
                <button
                  type="button"
                  onClick={removeSelected}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted sm:min-h-0 sm:text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("signPdf.removeSelected")}
                </button>
              )}
              {pageSigCount > 0 && (
                <button
                  type="button"
                  onClick={clearSignaturesOnPage}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 sm:min-h-0 sm:text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("signPdf.clearPage")}
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                disabled={stage === "saving" || annotations.filter((a) => a.type === "image").length === 0}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 sm:min-h-0 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
              >
                {stage === "saving" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {saveProgress}%
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {t("toolPage.downloadFile")}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-border bg-card/90 px-2 py-2 sm:px-4">
            <HardLockDownloadToggle
              enabled={hardLock}
              onToggleRequest={requestToggle}
              confirmOpen={confirmOpen}
              onConfirm={confirmEnable}
              onCancel={cancelEnable}
            />
          </div>

          <div className="relative flex flex-1 items-start justify-center overflow-auto p-3 sm:p-6">
            {error && (
              <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm text-white shadow-lg">
                <AlertCircle className="h-4 w-4" /> {error}
                <button type="button" className="ml-2 font-bold" onClick={() => setError(null)}>
                  ×
                </button>
              </div>
            )}
            {!pageCanvasReady && file && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/80 backdrop-blur-sm">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm font-medium text-muted-foreground">{t("signPdf.preparingPage")}</p>
              </div>
            )}
            {file && (
              <Suspense
                fallback={
                  <div className="flex h-[min(70vh,720px)] w-full max-w-3xl items-center justify-center rounded-2xl bg-muted/30">
                    <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                <PDFEditorCanvas
                  ref={pdfCanvasRef}
                  file={file}
                  pageNumber={currentPage}
                  annotations={annotations}
                  tool="cursor"
                  color="#1a1a1a"
                  lineWidth={2}
                  fontSize={14}
                  selectedId={selectedAnnId}
                  onSelectId={setSelectedAnnId}
                  onAnnotationsCommit={pushAnnotations}
                  onAdd={() => {}}
                  onDimUpdate={handleDimUpdate}
                  maxViewportScale={pdfScaleCap}
                  zoomFactor={zoomFactor}
                  fitWidthNonce={fitWidthNonce}
                />
              </Suspense>
            )}
          </div>

        </div>
      </div>

      {showSignPanel ? (
        <div className="hidden lg:block">
          <SignProPanel
            disabled={stage === "saving"}
            placementDisabled={!pageCanvasReady}
            onAdd={handleAddSignature}
            onClose={() => setShowSignPanel(false)}
            onError={(msg) => setError(msg)}
          />
        </div>
      ) : null}

      <MobileToolOptionsSheet
        open={signOptionsOpen}
        onOpenChange={setSignOptionsOpen}
        title={t("signPdf.addSignature")}
        preventScrollLock
      >
        <SignProPanel
          variant="embedded"
          disabled={stage === "saving"}
          placementDisabled={!pageCanvasReady}
          onAdd={handleAddSignature}
          onClose={() => setSignOptionsOpen(false)}
          onError={(msg) => setError(msg)}
        />
      </MobileToolOptionsSheet>

      {lastResult ? (
        <div className="fixed inset-x-0 bottom-0 z-[80] max-h-[min(88dvh,720px)] overflow-y-auto border-t border-border bg-card p-4 shadow-2xl lg:left-auto lg:right-6 lg:bottom-6 lg:max-w-md lg:rounded-2xl lg:border">
          <MobilePostProcessPanel
            currentSlug="sign-pdf"
            onDownload={() => void safeDownloadBlob(lastResult.blob, lastResult.filename)}
            onShare={() => void shareBlob(lastResult.blob, lastResult.filename)}
            onProcessAnother={() => {
              setLastResult(null);
              resetSignWorkflow();
              setProcessedFile(null);
            }}
            downloadLabel={t("toolPage.downloadFile")}
          />
          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
            onClick={() => setLastResult(null)}
          >
            {t("pdfEditor.continueEditing", { defaultValue: "Continue editing" })}
          </button>
        </div>
      ) : null}
    </div>
    </EditorDesktopChrome>
    </ToolRenderErrorBoundary>
  );
}
