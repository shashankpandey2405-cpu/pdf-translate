"use client";

import { useState, useCallback, useRef, useMemo, useEffect, lazy, Suspense } from "react";
import { EditorDesktopChrome } from "@/components/desktop/EditorDesktopChrome";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { EditorSelectionProperties } from "@/components/pdf-editor/EditorSelectionProperties";
import {
  MousePointer2, Type, Pen, Highlighter, Square, Minus, Eraser,
  Undo2, Redo2, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2,
  Trash2, FileText, AlertCircle, Image as ImageIcon, Shuffle, Circle, Signature,
  FileEdit, Layers, Files, RotateCw, Scissors, ArrowUp, ArrowDown, ArrowRight, Stamp,
  PanelLeft, PanelRight, ClipboardList, Expand,
} from "lucide-react";
import DropZone from "@/components/DropZone";
import type { PDFEditorCanvasHandle } from "@/components/PDFEditorCanvas";

const PDFEditorCanvas = lazy(() =>
  import("@/components/PDFEditorCanvas").then((mod) => ({ default: mod.PDFEditorCanvas })),
);
import { usePremium } from "@/context/PremiumContext";
import {
  type Annotation,
  type AnnotationTool,
  type CanvasDim,
  type LineAnnotation,
  type WhiteoutAnnotation,
  type TextAnnotation,
  type ImageAnnotation,
  saveAnnotationsToPDF,
  rearrangePDFPages,
  nextZIndexForPage,
  bringForward,
  sendBackward,
  genId,
} from "@/tools/pdf-editor/logic";
import {
  appendPdfFiles,
  deletePageFromPdf,
  compressCurrentPdf,
  rotateEditorPage,
} from "@/tools/pdf-editor/masterActions";
import { splitPDF, getSplitFilename } from "@/tools/split-pdf/logic";
import type { CompressionLevel } from "@/tools/compress-pdf/logic";
import dynamic from "next/dynamic";

const SignProPanel = dynamic(
  () => import("@/tools/pdf-editor/components/SignProPanel").then((m) => ({ default: m.SignProPanel })),
  { ssr: false, loading: () => null },
);
const EditorFormFiller = dynamic(
  () => import("@/tools/pdf-editor/components/FormFiller").then((m) => ({ default: m.FormFiller })),
  { ssr: false, loading: () => null },
);
const EditorStickyNote = dynamic(
  () => import("@/tools/pdf-editor/components/StickyNotePanel").then((m) => ({ default: m.StickyNotePanel })),
  { ssr: false, loading: () => null },
);
import type { ContentPick } from "@/tools/pdf-editor/components/PdfContentHitLayer";
import { editTextRunInPdf } from "@/tools/pdf-editor/textEdit/editTextRun";
import { measureSignaturePlacement, waitForEditorPageDim } from "@/tools/pdf-editor/signatureUtils";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { renderThumbWindow } from "@/lib/batchedPdfThumbs";
import { getEditorThumbWindowRadius } from "@/lib/render/canvasBudget";
import ToolSEO from "@/components/ToolSEO";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { logToolError, logToolSuccess } from "@/utils/logger";
import { cn } from "@/lib/utils";
import { mergeAnnotationsPreservingImageExportDim } from "@/tools/pdf-editor/annotationExportDim";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { EditorMobileDock } from "@/components/pdf-editor/EditorMobileDock";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { content } from "@/tools/pdf-editor/content";
import { useTranslation } from "react-i18next";
import { getPdfViewportMaxScale } from "@/lib/pdfRenderBudget";
import { releasePdfDocument } from "@/lib/pdfjsClient";
import { useUnsavedNavigationGuard } from "@/hooks/useUnsavedNavigationGuard";
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
import { PdfSearchPanel } from "@/tools/pdf-editor/components/PdfSearchPanel";
import { useEditorShortcuts } from "@/tools/pdf-editor/hooks/useEditorShortcuts";
import { addWatermark } from "@/tools/watermark-pdf/logic";
import { redactPdf } from "@/tools/redact-pdf/logic";

const hideEditorAds = (stage: "upload" | "edit" | "saving" | "rearranging") => stage !== "upload";

const TOOL_IDS: { id: AnnotationTool; icon: React.FC<{ className?: string }> }[] = [
  { id: "cursor", icon: MousePointer2 },
  { id: "content", icon: FileEdit },
  { id: "text", icon: Type },
  { id: "image", icon: ImageIcon },
  { id: "pen", icon: Pen },
  { id: "highlight", icon: Highlighter },
  { id: "rect", icon: Square },
  { id: "circle", icon: Circle },
  { id: "line", icon: Minus },
  { id: "arrow", icon: ArrowRight },
  { id: "whiteout", icon: Stamp },
  { id: "signature", icon: Signature },
  { id: "eraser", icon: Eraser },
];

const COLORS = ["#1a1a1a", "#007AFF", "#FF3B30", "#34C759", "#FF9500", "#AF52DE", "#FF2D55"];
const WIDTHS = [1, 2, 4, 6, 10];
const FONT_SIZES = [10, 12, 14, 18, 24, 32];

export default function PDFEditor() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbByPage, setThumbByPage] = useState<Record<number, string>>({});
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("cursor");
  const [rightPanelTab, setRightPanelTab] = useState<"tools" | "properties">("tools");
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(2);
  const [fontSize, setFontSize] = useState(14);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [stage, setStage] = useState<"upload" | "edit" | "saving" | "rearranging">("upload");
  const [saveProgress, setSaveProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [showPageReorder, setShowPageReorder] = useState(false);
  const [showSignaturePanel, setShowSignaturePanel] = useState(false);
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [imagePlacementOpacityPct, setImagePlacementOpacityPct] = useState(100);
  const [compressLevel, setCompressLevel] = useState<CompressionLevel>("recommended");
  const [contentDraft, setContentDraft] = useState<(ContentPick & { replace: string }) | null>(null);
  const [mobilePagesOpen, setMobilePagesOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [showStickyNote, setShowStickyNote] = useState(false);
  const [wmText, setWmText] = useState("CONFIDENTIAL");
  const [wmBusy, setWmBusy] = useState(false);
  const [redactBusy, setRedactBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const { setProcessedFile } = useProcess();
  const { saveSession } = useWorkspaceHistory();
  /** Stable cap at workspace mount — avoids rerenders / scale jitter on window resize. */
  const pdfScaleCap = useMemo(() => getPdfViewportMaxScale(), []);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [fitWidthNonce, setFitWidthNonce] = useState(0);
  const mergeMoreInputRef = useRef<HTMLInputElement>(null);
  const dimsRef = useRef<Record<number, CanvasDim>>({});
  const editorCanvasRef = useRef<PDFEditorCanvasHandle>(null);
  const editorWorkspaceRef = useRef<HTMLDivElement>(null);
  const { canUse } = usePremium();
  const {
    hardLock,
    confirmOpen,
    requestToggle,
    confirmEnable,
    cancelEnable,
    applyHardLock,
  } = useHardLockEnabled();
  const [pageCanvasReady, setPageCanvasReady] = useState(false);
  const handleDimUpdate = useCallback((page: number, dim: CanvasDim) => {
    dimsRef.current[page] = dim;
    if (page === currentPage - 1) setPageCanvasReady(true);
  }, [currentPage]);

  useEffect(() => {
    setPageCanvasReady(false);
    const page = currentPage - 1;
    if (dimsRef.current[page]) setPageCanvasReady(true);
  }, [currentPage, file]);

  useEffect(() => {
    if (!file || pageCount < 1) return;
    let cancelled = false;
    void renderThumbWindow(file, currentPage, 0.3)
      .then((windowMap) => {
        if (cancelled) return;
        setThumbByPage((prev) => {
          const next = { ...prev };
          for (const [page, url] of windowMap) next[page] = url;
          const radius = getEditorThumbWindowRadius();
          const keepMin = Math.max(1, currentPage - radius * 2);
          const keepMax = currentPage + radius * 2;
          for (const key of Object.keys(next)) {
            const p = Number(key);
            if (p < keepMin || p > keepMax) delete next[p];
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setThumbByPage({});
      });
    return () => {
      cancelled = true;
    };
  }, [file, currentPage, pageCount]);

  const replaceWorkspacePdf = useCallback(
    async (bytes: Uint8Array, suggestedName: string) => {
      const nf = new File([bytes as BlobPart], suggestedName.endsWith(".pdf") ? suggestedName : `${suggestedName}.pdf`, {
        type: "application/pdf",
      });
      const check = canUse(1, nf.size / (1024 * 1024), "pdf-editor");
      if (!check.allowed) {
        setError(check.reason ?? t("pdfEditor.premiumLimitFallback"));
        return;
      }
      setFile((prev) => {
        if (prev) releasePdfDocument(prev);
        return nf;
      });
      setAnnotations([]);
      setHistory([[]]);
      setHistIdx(0);
      setSelectedAnnId(null);
      setCurrentPage(1);
      setZoomFactor(1);
      setFitWidthNonce((n) => n + 1);
      setError(null);
      const count = await getPDFPageCount(nf);
      setPageCount(count);
      setPageOrder(Array.from({ length: count }, (_, i) => i));
      setThumbByPage({});
    },
    [canUse, t]
  );

  const presentEditorResult = useCallback(
    (bytes: Uint8Array, filename: string, flow: string, originalSize: number) => {
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setLastResult({ blob, filename });
      setProcessedFile({
        blob,
        filename,
        tool: "PDF Editor",
        toolSlug: "pdf-editor",
        originalSize,
        processedSize: bytes.length,
      });
      logToolSuccess("pdf-editor", { flow, filename });
      if (flow === "save_annotated_pdf") {
        persistWorkspaceOutput(saveSession, {
          filename,
          toolSlug: "pdf-editor",
          toolLabel: "PDF Editor",
          data: bytes,
        });
      }
    },
    [setProcessedFile, saveSession],
  );

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    const check = canUse(1, f.size / (1024 * 1024), "pdf-editor");
    if (!check.allowed) {
      setError(check.reason!);
      logToolError("pdf-editor", "upload_premium_blocked", new Error(check.reason ?? "blocked"));
      return;
    }
    setFile((prev) => {
      if (prev) releasePdfDocument(prev);
      return f;
    });
    setAnnotations([]);
    setHistory([[]]);
    setHistIdx(0);
    setCurrentPage(1);
    setZoomFactor(1);
    setFitWidthNonce((n) => n + 1);
    setStage("edit");
    setError(null);
    void getPDFPageCount(f)
      .then((count) => {
        setPageCount(count);
        setPageOrder(Array.from({ length: count }, (_, i) => i));
      })
      .catch(() => {
        setPageCount(1);
        setPageOrder([0]);
      });
    void renderThumbWindow(f, 1, 0.3)
      .then((m) => setThumbByPage(Object.fromEntries(m)))
      .catch(() => setThumbByPage({}));
    persistWorkspaceOutput(saveSession, {
      filename: f.name,
      toolSlug: "pdf-editor",
      toolLabel: "PDF Editor",
      data: f,
    });
  }, [canUse, saveSession]);

  useWorkspaceResume({
    toolSlug: "pdf-editor",
    enabled: stage === "upload",
    onResume: (f) => handleFiles([f]),
  });

  const resetEditorWorkflow = useCallback(() => {
    dimsRef.current = {};
    setLastResult(null);
    setStage("upload");
    setFile((prev) => {
      if (prev) releasePdfDocument(prev);
      return null;
    });
    setPageCount(0);
    setCurrentPage(1);
    setThumbByPage({});
    setAnnotations([]);
    setHistory([[]]);
    setHistIdx(0);
    setActiveTool("cursor");
    setSelectedAnnId(null);
    setError(null);
    setPageOrder([]);
    setShowPageReorder(false);
    setShowSignaturePanel(false);
    setZoomFactor(1);
    setFitWidthNonce((n) => n + 1);
    setContentDraft(null);
    setMobilePagesOpen(false);
    setMobileToolsOpen(false);
    setShowFormFiller(false);
    setShowStickyNote(false);
    setWmText("CONFIDENTIAL");
    if (mergeMoreInputRef.current) mergeMoreInputRef.current.value = "";
  }, []);

  function pushHistory(nextOrUpdater: Annotation[] | ((prev: Annotation[]) => Annotation[])) {
    const page = currentPage - 1;
    const dim = dimsRef.current[page];
    setAnnotations((prev) => {
      const next = typeof nextOrUpdater === "function" ? nextOrUpdater(prev) : nextOrUpdater;
      const merged = mergeAnnotationsPreservingImageExportDim(prev, next, page, dim);
      setHistory((h) => {
        const nh = h.slice(0, histIdx + 1);
        nh.push([...merged]);
        setHistIdx(nh.length - 1);
        return nh;
      });
      return merged;
    });
  }

  function handleAdd(nextAnn: Annotation) {
    pushHistory((prev) => {
      const z = nextAnn.zIndex ?? nextZIndexForPage(prev, nextAnn.page);
      return [...prev, { ...nextAnn, zIndex: z }];
    });
  }

  async function handleAddSignature(signatureDataUrl: string) {
    try {
      if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/")) {
        throw new Error("Invalid signature data");
      }

      const page = currentPage - 1;
      const exportDim = await waitForEditorPageDim(
        () => editorCanvasRef.current?.getCanvasDim() ?? dimsRef.current[page],
      );
      if (!exportDim) {
        const msg = t("signPdf.waitForPageLoad");
        setError(msg);
        throw new Error(msg);
      }
      const { w, h } = await measureSignaturePlacement(signatureDataUrl);
      const margin = 24;
      const x = Math.max(margin, (exportDim.width - w) / 2);
      const y = Math.max(margin, exportDim.height * 0.72 - h);
      const newId = genId();
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
        zIndex: 0,
      };
      pushHistory((prev) => {
        ann.zIndex = nextZIndexForPage(prev, page);
        return [...prev, ann];
      });
      requestAnimationFrame(() => setSelectedAnnId(newId));
      setActiveTool("cursor");
      setShowSignaturePanel(false);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("signPdf.addFailed");
      setError(msg);
      logToolError("pdf-editor", "add_signature_failed", err);
      throw err;
    }
  }

  const openSignaturePanel = useCallback(() => {
    if (!file) return;
    if (!pageCanvasReady) {
      setError(t("signPdf.waitForPageLoad"));
      return;
    }
    setError(null);
    setShowSignaturePanel(true);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobileToolsOpen(true);
      setMobilePagesOpen(false);
    }
  }, [file, pageCanvasReady, t]);

  async function mergeMorePdfs(fileList: FileList | null) {
    if (!file || !fileList?.length) return;
    const extras = Array.from(fileList).filter((f) => /\.pdf$/i.test(f.name));
    if (!extras.length) return;
    try {
      const bytes = await appendPdfFiles(file, extras);
      await replaceWorkspacePdf(bytes, file.name.replace(/\.pdf$/i, "") + "_merged.pdf");
    } catch (e) {
      logToolError("pdf-editor", "merge_append_pdfs", e);
      setError(e instanceof Error ? e.message : t("pdfEditor.errors.mergeFailed"));
    }
    if (mergeMoreInputRef.current) mergeMoreInputRef.current.value = "";
  }

  async function compressInPlace() {
    if (!file) return;
    try {
      setStage("saving");
      const bytes = await compressCurrentPdf(file, compressLevel);
      await replaceWorkspacePdf(bytes, file.name.replace(/\.pdf$/i, "") + "_compressed.pdf");
      setStage("edit");
    } catch (e) {
      logToolError("pdf-editor", "compress_workspace", e);
      setError(e instanceof Error ? e.message : t("pdfEditor.errors.compressFailed"));
      setStage("edit");
    }
  }

  async function rotateCurrent90() {
    if (!file) return;
    try {
      const bytes = await rotateEditorPage(file, currentPage - 1, 90);
      await replaceWorkspacePdf(bytes, file.name.replace(/\.pdf$/i, "") + "_rotated.pdf");
    } catch (e) {
      logToolError("pdf-editor", "rotate_page", e);
      setError(e instanceof Error ? e.message : t("pdfEditor.errors.rotateFailed"));
    }
  }

  async function deleteCurrentPage() {
    if (!file || pageCount <= 1) return;
    try {
      const bytes = await deletePageFromPdf(file, currentPage - 1);
      const name = file.name.replace(/\.pdf$/i, "") + "_removed_page.pdf";
      await replaceWorkspacePdf(bytes, name);
    } catch (e) {
      logToolError("pdf-editor", "delete_page", e);
      setError(e instanceof Error ? e.message : t("pdfEditor.errors.deletePageFailed"));
    }
  }

  async function exportCurrentPageSplit() {
    if (!file) return;
    try {
      const bytes = await splitPDF(file, [currentPage - 1]);
      presentEditorResult(bytes, getSplitFilename(file.name, [currentPage - 1]), "split_current_page_export", file.size);
    } catch (e) {
      logToolError("pdf-editor", "split_current_page_export", e);
      setError(e instanceof Error ? e.message : t("pdfEditor.errors.splitFailed"));
    }
  }

  function patchSelectedImage(patch: Partial<ImageAnnotation>) {
    if (!selectedAnnId) return;
    const next = annotations.map((a) =>
      a.id === selectedAnnId && a.type === "image" ? { ...a, ...patch } : a
    );
    pushHistory(next);
  }

  function patchSelectedAnnotation(patch: Record<string, number | string | boolean>) {
    if (!selectedAnnId) return;
    pushHistory(
      annotations.map((a) => (a.id === selectedAnnId ? ({ ...a, ...patch } as Annotation) : a)),
    );
  }

  function handleContentPickRegion(pick: ContentPick) {
    setContentDraft({ ...pick, replace: pick.sample || "" });
  }

  async function applyContentDraft() {
    if (!contentDraft || !file) return;
    const page = currentPage - 1;
    const mergedDims = { ...dimsRef.current };
    const live = editorCanvasRef.current?.getCanvasDim();
    if (live) mergedDims[page] = live;

    try {
      setStage("saving");
      const bytes = await editTextRunInPdf(file, page, contentDraft, mergedDims);
      await replaceWorkspacePdf(bytes, file.name.replace(/\.pdf$/i, "") + "_text_edited.pdf");
      setContentDraft(null);
      setActiveTool("cursor");
      setStage("edit");
    } catch (e) {
      logToolError("pdf-editor", "content_text_edit", e, { recoverable: true });
      const zi = nextZIndexForPage(annotations, page);
      const white: WhiteoutAnnotation = {
        id: genId(),
        type: "whiteout",
        page,
        x: contentDraft.vx,
        y: contentDraft.vy,
        w: contentDraft.vw,
        h: contentDraft.vh,
        zIndex: zi,
      };
      const size = Math.min(22, Math.max(11, Math.round(contentDraft.vh * 0.55)));
      const textAnn: TextAnnotation = {
        id: genId(),
        type: "text",
        page,
        x: contentDraft.vx + 2,
        y: contentDraft.vy + size * 0.9,
        text: contentDraft.replace || " ",
        size,
        color: "#0a1628",
        zIndex: zi + 1,
      };
      pushHistory([...annotations, white, textAnn]);
      setContentDraft(null);
      setActiveTool("cursor");
      setStage("edit");
    }
  }

  function undo() {
    if (histIdx <= 0) return;
    const newIdx = histIdx - 1;
    setHistIdx(newIdx);
    setAnnotations([...history[newIdx]]);
  }

  function redo() {
    if (histIdx >= history.length - 1) return;
    const newIdx = histIdx + 1;
    setHistIdx(newIdx);
    setAnnotations([...history[newIdx]]);
  }

  function deleteSelectedAnnotation() {
    if (!selectedAnnId) return;
    pushHistory(annotations.filter((a) => a.id !== selectedAnnId));
    setSelectedAnnId(null);
  }

  function handleStickyNoteAdd(note: { text: string; color: string }) {
    const page = currentPage - 1;
    const exportDim = editorCanvasRef.current?.getCanvasDim() ?? dimsRef.current[page];
    if (!exportDim) return;
    const ann: TextAnnotation = {
      id: genId(),
      type: "text",
      page,
      x: 40,
      y: Math.max(40, exportDim.height * 0.72),
      text: note.text,
      size: Math.min(20, fontSize + 4),
      color: note.color,
      bold: false,
      italic: false,
    };
    handleAdd(ann);
    setShowStickyNote(false);
  }

  async function toggleWorkspaceFullscreen() {
    const el = editorWorkspaceRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }

  async function applyBurnInWatermark() {
    if (!file || !wmText.trim()) return;
    setWmBusy(true);
    try {
      const bytes = await addWatermark(file, {
        text: wmText.trim(),
        opacity: 0.18,
        fontSize: 44,
        color: "gray",
        rotation: -33,
        position: "center",
      });
      await replaceWorkspacePdf(bytes, file.name.replace(/\.pdf$/i, "") + "_watermarked.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Watermark failed");
    } finally {
      setWmBusy(false);
    }
  }

  async function applyPatternRedaction() {
    if (!file) return;
    setRedactBusy(true);
    try {
      const bytes = await redactPdf(file, { patterns: ["email", "phone"] });
      await replaceWorkspacePdf(bytes, file.name.replace(/\.pdf$/i, "") + "_redacted.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Redaction failed");
    } finally {
      setRedactBusy(false);
    }
  }

  useEditorShortcuts(stage === "edit", {
    onUndo: undo,
    onRedo: redo,
    onDeleteSelection: deleteSelectedAnnotation,
  });

  const editorDirty = stage === "edit" && histIdx > 0;
  useUnsavedNavigationGuard(editorDirty, { confirmPopstate: true });

  function clearPage() {
    const remaining = annotations.filter((a) => a.page !== currentPage - 1);
    pushHistory(remaining);
  }

  async function handleSave() {
    if (!file) return;

    const mergedDims = { ...dimsRef.current };
    const live = editorCanvasRef.current?.getCanvasDim();
    if (live) mergedDims[currentPage - 1] = live;

    const images = annotations.filter((a): a is ImageAnnotation => a.type === "image");
    for (const a of images) {
      if (!(a.exportDim ?? mergedDims[a.page])) {
        setError(t("signPdf.exportMissingDim", { page: a.page + 1 }));
        return;
      }
    }

    setStage("saving");
    setSaveProgress(0);
    let timer: ReturnType<typeof setInterval> | null = null;
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
          timer = setInterval(() => setSaveProgress((p) => Math.min(p + 8, 92)), 200);
          try {
            const result = await saveAnnotationsToPDF(file, annotations, mergedDims);
            const finalBytes = await applyHardLock(result, (page, total) => {
              setSaveProgress(60 + Math.round((page / Math.max(total, 1)) * 35));
            });
            setSaveProgress(100);
            const editedName = file.name.replace(/\.pdf$/i, "") + "_edited.pdf";
            const filename = hardLock ? getHardLockedFilename(editedName) : editedName;
            presentEditorResult(finalBytes, filename, "save_annotated_pdf", file.size);
            setStage("edit");
            setSaveProgress(0);
          } finally {
            if (timer) clearInterval(timer);
            timer = null;
          }
        },
      );
    } catch (err) {
      logToolError("pdf-editor", "save_annotated_pdf", err);
      setError(err instanceof Error ? err.message : t("pdfEditor.errors.savePdfFailed"));
      setStage("edit");
    }
  }

  async function handleRearrangePages() {
    if (!file || pageOrder.length === 0) return;
    setStage("saving");
    setSaveProgress(0);
    let timer: ReturnType<typeof setInterval> | null = null;
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
          timer = setInterval(() => setSaveProgress((p) => Math.min(p + 8, 92)), 200);
          try {
            const result = await rearrangePDFPages(file, pageOrder);
            setSaveProgress(100);
            const filename = file.name.replace(/\.pdf$/i, "") + "_rearranged.pdf";
            presentEditorResult(result, filename, "rearrange_pages_pdf", file.size);
            setStage("edit");
            setSaveProgress(0);
            setShowPageReorder(false);
          } finally {
            if (timer) clearInterval(timer);
            timer = null;
          }
        },
      );
    } catch (err) {
      logToolError("pdf-editor", "rearrange_pages", err);
      setError(err instanceof Error ? err.message : t("pdfEditor.errors.rearrangeFailed"));
      setStage("edit");
    }
  }

  function movePage(fromIndex: number, toIndex: number) {
    const newOrder = [...pageOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setPageOrder(newOrder);
  }

  const sortedPageLayers = [...annotations]
    .filter((a) => a.page === currentPage - 1)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const selectedAnnotation = selectedAnnId ? annotations.find((a) => a.id === selectedAnnId) : undefined;

  const pageAnnsCount = annotations.filter((a) => a.page === currentPage - 1).length;

  if (stage === "upload") {
    return (
      <ToolRenderErrorBoundary onReset={resetEditorWorkflow}>
        <div className="mx-auto hidden max-w-5xl px-4 py-10 sm:px-6 lg:block">
          <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="pdf-editor" lang={i18n.language} />
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <DropZone
            onFiles={handleFiles}
            multiple={false}
            label={t("pdfEditor.uploadDrop")}
            sublabel={t("pdfEditor.uploadSublabel")}
          />
        </div>
        <MobileToolLayout slug="pdf-editor" toolLabel={content.hero.title} title={content.hero.title} workflowStep="upload">
          <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="pdf-editor" lang={i18n.language} />
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <ToolUploadSlot
            files={[]}
            onFiles={handleFiles}
            multiple={false}
            label={t("pdfEditor.uploadDrop")}
            sublabel={t("pdfEditor.uploadSublabel")}
          />
        </MobileToolLayout>
      </ToolRenderErrorBoundary>
    );
  }

  /** Fresh element tree per mount — never reuse one JSX object in desktop + mobile slots. */
  const renderEditorWorkspace = () => (
    <div
      ref={editorWorkspaceRef}
      className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30"
      data-testid="pdf-editor-workspace"
    >
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="pdf-editor" lang={i18n.language} />
      {(mobilePagesOpen || mobileToolsOpen) && (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-16 z-[44] bg-black/45 lg:hidden"
          aria-label={t("pdfEditor.closePanels")}
          onClick={() => {
            setMobilePagesOpen(false);
            setMobileToolsOpen(false);
          }}
        />
      )}

      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/95 px-2 py-2 backdrop-blur-md lg:hidden">
        <button
          type="button"
          aria-expanded={mobilePagesOpen}
          aria-controls="pdf-editor-pages-panel"
          onClick={() => {
            setMobileToolsOpen(false);
            setMobilePagesOpen((v) => !v);
          }}
          className="inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-3 text-xs font-semibold text-foreground active:bg-muted"
        >
          <PanelLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="sr-only">{t("pdfEditor.pagesHeading")}</span>
        </button>
        <button
          type="button"
          aria-expanded={mobileToolsOpen}
          aria-controls="pdf-editor-tools-panel"
          onClick={() => {
            setMobilePagesOpen(false);
            setMobileToolsOpen((v) => !v);
          }}
          className="inline-flex h-11 min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-3 text-xs font-semibold text-foreground active:bg-muted"
        >
          <PanelRight className="h-4 w-4 shrink-0" aria-hidden />
          <span className="sr-only">{t("pdfEditor.toolsHeading")}</span>
        </button>
      </div>

      {/* Desktop: annotation + style tools across the top */}
      <div className="hidden shrink-0 flex-col gap-2 border-b border-border bg-card/95 px-3 py-2 lg:flex">
        <div className="flex flex-wrap items-center gap-1.5">
          {TOOL_IDS.map((toolItem) => (
            <button
              key={toolItem.id}
              type="button"
              data-testid={`top-tool-${toolItem.id}`}
              onClick={() => setActiveTool(toolItem.id)}
              title={t(`pdfEditor.tools.${toolItem.id}`)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${activeTool === toolItem.id ? "bg-primary text-white shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <toolItem.icon className="h-4 w-4 shrink-0" />
              <span>{t(`pdfEditor.tools.${toolItem.id}`)}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={openSignaturePanel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
          >
            <Signature className="h-4 w-4" />
            {t("pdfEditor.addSignatureToolbar")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveColor(c)}
                className={`h-7 w-7 rounded-md border-2 transition-all ${activeColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded-md border border-border"
              title={t("pdfEditor.customColor")}
            />
          </div>
          {(activeTool === "pen" || activeTool === "rect" || activeTool === "circle" || activeTool === "line" || activeTool === "arrow") && (
            <div className="flex items-center gap-1">
              {WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setLineWidth(w)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border ${lineWidth === w ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <div className="rounded-full bg-foreground" style={{ width: Math.min(w * 2, 14), height: Math.min(w * 2, 14) }} />
                </button>
              ))}
            </div>
          )}
          {activeTool === "text" && (
            <div className="flex flex-wrap items-center gap-1">
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFontSize(s)}
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${fontSize === s ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTextBold((prev) => !prev)}
                className={`rounded-md border px-2 py-0.5 text-xs font-bold ${textBold ? "border-primary bg-primary/10" : "border-border"}`}
              >
                {t("pdfEditor.bold")}
              </button>
              <button
                type="button"
                onClick={() => setTextItalic((prev) => !prev)}
                className={`rounded-md border px-2 py-0.5 text-xs italic ${textItalic ? "border-primary bg-primary/10" : "border-border"}`}
              >
                {t("pdfEditor.italic")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`flex min-h-0 flex-1 overflow-hidden lg:flex-row ${isRTL ? "lg:flex-row-reverse" : ""}`}>
      {/* Left: Page Thumbnails */}
      <div
        id="pdf-editor-pages-panel"
        className={`relative z-[45] flex-shrink-0 overflow-y-auto overscroll-contain border-border bg-card transition-transform duration-200 ease-out max-lg:fixed max-lg:bottom-0 max-lg:top-16 max-lg:max-h-[calc(100dvh-4rem)] max-lg:w-[min(92vw,168px)] max-lg:border-r max-lg:pb-[env(safe-area-inset-bottom)] max-lg:shadow-xl lg:static lg:z-auto lg:max-h-[calc(100dvh-4rem)] lg:w-[168px] lg:translate-x-0 lg:shadow-none ${isRTL ? "max-lg:right-0 max-lg:border-l max-lg:border-r-0 lg:border-l lg:border-r-0" : "max-lg:left-0 lg:border-r"} ${isRTL ? (mobilePagesOpen ? "max-lg:translate-x-0" : "max-lg:translate-x-full") : mobilePagesOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"} border-border`}
      >
        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("pdfEditor.pagesHeading")}</p>
          <div className="space-y-2">
            {pageCount > 0
              ? Array.from({ length: pageCount }, (_, i) => {
                  const thumb = thumbByPage[i + 1];
                  return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCurrentPage(i + 1);
                      setMobilePagesOpen(false);
                    }}
                    data-testid={`page-thumb-nav-${i}`}
                    className={`relative w-full rounded-xl overflow-hidden border-2 transition-all ${currentPage === i + 1 ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"}`}
                  >
                    {thumb ? (
                    <img src={thumb} alt={t("pdfEditor.pageAlt", { n: i + 1 })} className="w-full object-contain" />
                    ) : (
                    <div className="aspect-[3/4] w-full animate-pulse bg-muted" />
                    )}
                    {annotations.filter((a) => a.page === i).length > 0 && (
                      <span
                        className={`absolute top-1 ${isRTL ? "left-1" : "right-1"} w-4 h-4 bg-primary rounded-full text-white text-[9px] flex items-center justify-center font-bold`}
                      >
                        {annotations.filter((a) => a.page === i).length}
                      </span>
                    )}
                    <span className="absolute bottom-0 left-0 right-0 bg-white/90 text-center text-[10px] font-medium py-0.5">{i + 1}</span>
                  </button>
                  );
                })
              : Array.from({ length: Math.min(pageCount, 8) }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted rounded-xl animate-pulse" />
                ))}
          </div>
          {file && <DocumentAuditorPanel file={file} className="mt-4" />}

          <input
            ref={mergeMoreInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => void mergeMorePdfs(e.target.files)}
          />

          <div className={`mt-5 pt-4 border-border border-t ${isRTL ? "text-right" : ""}`}>
            <p
              className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" /> {t("pdfEditor.masterPdf")}
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => mergeMoreInputRef.current?.click()}
                disabled={stage === "saving"}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 py-2 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                <Files className="w-3.5 h-3.5 shrink-0" /> {t("pdfEditor.merge")}
              </button>
              <button
                type="button"
                onClick={() => void rotateCurrent90()}
                disabled={stage === "saving" || pageCount === 0}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 py-2 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                <RotateCw className="w-3.5 h-3.5 shrink-0" /> {t("pdfEditor.rotate90")}
              </button>
              <button
                type="button"
                onClick={() => void exportCurrentPageSplit()}
                disabled={!file}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 py-2 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                <Scissors className="w-3.5 h-3.5 shrink-0" /> {t("pdfEditor.splitPage")}
              </button>
              <select
                value={compressLevel}
                onChange={(ev) => setCompressLevel(ev.target.value as CompressionLevel)}
                disabled={stage === "saving"}
                dir={isRTL ? "rtl" : "ltr"}
                className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-[11px]"
              >
                <option value="extreme">{t("pdfEditor.compressExtreme")}</option>
                <option value="recommended">{t("pdfEditor.compressBalanced")}</option>
                <option value="less">{t("pdfEditor.compressLight")}</option>
              </select>
              <button
                type="button"
                onClick={() => void compressInPlace()}
                disabled={stage === "saving" || !file}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2 text-[11px] font-semibold text-primary hover:bg-primary/15 disabled:opacity-50"
              >
                {t("pdfEditor.applyCompress")}
              </button>
              <button
                type="button"
                onClick={() => void deleteCurrentPage()}
                disabled={pageCount <= 1 || stage === "saving"}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 py-2 text-[11px] font-semibold text-destructive hover:bg-destructive/15 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" /> {t("pdfEditor.deletePage")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="surface-glass sticky top-0 z-40 flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-border/60 px-2 py-2 sm:h-12 sm:min-h-12 sm:px-4 sm:py-0">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <ToolWorkflowActions
              onReset={resetEditorWorkflow}
              resetDisabled={stage === "saving" || stage === "rearranging"}
              className="border-border max-sm:w-full max-sm:border-b max-sm:border-border max-sm:pb-2 sm:border-r sm:pr-2 sm:mr-1"
            />
            <TrustShieldBadge compact className="hidden sm:inline-flex" />
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted disabled:opacity-40 transition-colors sm:min-h-0 sm:min-w-0 sm:p-1.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-foreground sm:text-sm">
              {t("pdfEditor.pageNofM", { current: currentPage, total: pageCount || "…" })}
            </span>
            <button onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted disabled:opacity-40 transition-colors sm:min-h-0 sm:min-w-0 sm:p-1.5">
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="mx-1 flex items-center gap-0.5 border-border sm:mx-2 sm:border-x sm:px-2" aria-label={t("pdfEditor.zoomLabel")}>
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
              <button
                type="button"
                title={t("pdfEditor.fullscreen", { defaultValue: "Fullscreen workspace" })}
                onClick={() => void toggleWorkspaceFullscreen()}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted sm:min-h-0 sm:min-w-0 sm:p-1.5"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex max-w-full flex-wrap items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              data-testid="pdf-editor-toolbar-add-signature"
              onClick={openSignaturePanel}
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl border border-primary/35 bg-primary/10 px-2 py-2 text-xs font-semibold text-primary hover:bg-primary/15 sm:min-h-0 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm"
            >
              <Signature className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t("pdfEditor.addSignatureToolbar")}</span>
            </button>
            <button onClick={undo} disabled={histIdx <= 0}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted disabled:opacity-40 transition-colors sm:min-h-0 sm:min-w-0 sm:p-1.5" title={t("pdfEditor.undo")}>
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={histIdx >= history.length - 1}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-muted disabled:opacity-40 transition-colors sm:min-h-0 sm:min-w-0 sm:p-1.5" title={t("pdfEditor.redo")}>
              <Redo2 className="w-4 h-4" />
            </button>
            {pageAnnsCount > 0 && (
              <button onClick={clearPage}
                className="flex min-h-[44px] items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors sm:min-h-0" title={t("pdfEditor.clearPage")}>
                <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t("pdfEditor.clearPage")}</span>
              </button>
            )}
            <button
              data-testid="button-save-edited-pdf"
              onClick={handleSave}
              disabled={stage === "saving"}
              className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-60 transition-colors sm:min-h-0 sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-sm"
            >
              {stage === "saving" ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{saveProgress}%</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> {t("pdfEditor.savePdf")}</>
              )}
            </button>
            <button
              onClick={() => setShowPageReorder(!showPageReorder)}
              className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors sm:min-h-0 sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-sm"
              title={t("pdfEditor.rearrange")}
            >
              <Shuffle className="w-3.5 h-3.5" /> <span className="max-sm:hidden">{t("pdfEditor.rearrange")}</span>
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

        {/* Canvas area */}
        <div className="relative flex flex-1 touch-manipulation items-start justify-center overflow-auto p-3 pb-28 sm:p-6 lg:pb-6">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-destructive text-white text-sm rounded-xl shadow-lg">
              <AlertCircle className="w-4 h-4" /> {error}
              <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
            </div>
          )}
          {file && (
            <Suspense
              fallback={
                <div className="flex h-[min(70vh,720px)] w-full max-w-4xl items-center justify-center rounded-2xl bg-muted/30">
                  <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
                </div>
              }
            >
              <PDFEditorCanvas
                ref={editorCanvasRef}
                file={file}
                pageNumber={currentPage}
                annotations={annotations}
                tool={activeTool}
                color={activeColor}
                lineWidth={lineWidth}
                fontSize={fontSize}
                textBold={textBold}
                textItalic={textItalic}
                defaultImageOpacity={imagePlacementOpacityPct / 100}
                selectedId={selectedAnnId}
                onSelectId={setSelectedAnnId}
                onAnnotationsCommit={pushHistory}
                onContentPick={handleContentPickRegion}
                onAdd={handleAdd}
                onDimUpdate={handleDimUpdate}
                contentPickHint={t("pdfEditor.contentHitHint")}
                maxViewportScale={pdfScaleCap}
                zoomFactor={zoomFactor}
                fitWidthNonce={fitWidthNonce}
              />
            </Suspense>
          )}
          {showFormFiller ? (
            <EditorFormFiller fields={[]} onFieldChange={() => undefined} onClose={() => setShowFormFiller(false)} />
          ) : null}
          {showStickyNote ? (
            <EditorStickyNote onAdd={handleStickyNoteAdd} onClose={() => setShowStickyNote(false)} />
          ) : null}
        </div>
      </div>

      {/* Right: Toolbar */}
      <div
        id="pdf-editor-tools-panel"
        className={`relative z-[45] flex-shrink-0 overflow-y-auto overscroll-contain border-border bg-card transition-transform duration-200 ease-out max-lg:fixed max-lg:bottom-0 max-lg:top-16 max-lg:max-h-[calc(100dvh-4rem)] max-lg:w-[min(92vw,260px)] max-lg:border-l max-lg:pb-[env(safe-area-inset-bottom)] max-lg:shadow-xl lg:hidden ${isRTL ? "max-lg:left-0 max-lg:border-r max-lg:border-l-0" : "max-lg:right-0"} ${isRTL ? (mobileToolsOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full") : mobileToolsOpen ? "max-lg:translate-x-0" : "max-lg:translate-x-full"} border-border`}
      >
        <div className="space-y-5 p-3 surface-glass lg:rounded-none">
          {showSignaturePanel ? (
            <div className="border-b border-border pb-4 lg:hidden">
              <SignProPanel
                variant="embedded"
                disabled={stage === "saving"}
                placementDisabled={!pageCanvasReady}
                onAdd={handleAddSignature}
                onClose={() => setShowSignaturePanel(false)}
                onError={(msg) => setError(msg)}
              />
            </div>
          ) : null}
          <div className="hidden lg:flex rounded-xl border border-border bg-muted/40 p-0.5 text-[11px] font-semibold">
            {(["tools", "properties"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRightPanelTab(tab)}
                className={`flex-1 rounded-lg px-2 py-1.5 transition-colors ${rightPanelTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {tab === "tools" ? t("pdfEditor.toolsHeading") : t("pdfEditor.propertiesTab", { defaultValue: "Properties" })}
              </button>
            ))}
          </div>

          <div className={cn("space-y-5", rightPanelTab === "properties" && "hidden max-lg:block")}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 lg:sr-only">{t("pdfEditor.toolsHeading")}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TOOL_IDS.map((toolItem) => (
                <button
                  key={toolItem.id}
                  data-testid={`tool-${toolItem.id}`}
                  onClick={() => setActiveTool(toolItem.id)}
                  title={t(`pdfEditor.tools.${toolItem.id}`)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-medium transition-all ${activeTool === toolItem.id ? "bg-primary text-white shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <toolItem.icon className="w-4 h-4" />
                  {t(`pdfEditor.tools.${toolItem.id}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forms & notes</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowStickyNote(false);
                  setShowFormFiller((v) => !v);
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-[11px] font-medium transition-colors ${showFormFiller ? "bg-primary text-white" : "bg-muted/60 hover:bg-muted"}`}
              >
                <ClipboardList className="h-4 w-4" />
                Form fill
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFormFiller(false);
                  setShowStickyNote((v) => !v);
                }}
                className={`flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-[11px] font-medium transition-colors ${showStickyNote ? "bg-primary text-white" : "bg-muted/60 hover:bg-muted"}`}
              >
                <FileText className="h-4 w-4" />
                Sticky note
              </button>
            </div>
          </div>

          <PdfSearchPanel file={file} onHighlightPage={(p) => setCurrentPage(p)} />

          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("pdfEditor.burnInExtras", { defaultValue: "Burn-in tools" })}
            </p>
            <label className="block text-[10px] font-medium text-muted-foreground">Watermark text</label>
            <input
              type="text"
              value={wmText}
              onChange={(e) => setWmText(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
              disabled={wmBusy || redactBusy}
            />
            <button
              type="button"
              disabled={wmBusy || !file}
              onClick={() => void applyBurnInWatermark()}
              className="w-full rounded-lg bg-primary/90 py-2 text-[11px] font-semibold text-white hover:bg-primary disabled:opacity-50"
            >
              {wmBusy ? "…" : t("pdfEditor.applyWatermark", { defaultValue: "Apply watermark" })}
            </button>
            <button
              type="button"
              disabled={redactBusy || !file}
              onClick={() => void applyPatternRedaction()}
              className="w-full rounded-lg border border-border py-2 text-[11px] font-semibold hover:bg-muted disabled:opacity-50"
            >
              {redactBusy ? "…" : t("pdfEditor.redactPatterns", { defaultValue: "Redact emails & phones" })}
            </button>
          </div>

          <div className={cn("space-y-5", rightPanelTab === "tools" && "hidden max-lg:block")}>
          {selectedAnnotation ? (
            <EditorSelectionProperties annotation={selectedAnnotation} onPatch={patchSelectedAnnotation} />
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {t("pdfEditor.selectObjectHint", { defaultValue: "Click an object on the page to edit position, size, and style." })}
            </p>
          )}

          {/* Colors */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("pdfEditor.color")}</p>
            <div className="grid grid-cols-4 gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveColor(c)}
                  data-testid={`color-${c}`}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${activeColor === c ? "border-foreground scale-110 shadow-md" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="col-span-4 mt-1">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer border border-border"
                  title={t("pdfEditor.customColor")}
                />
              </div>
            </div>
          </div>

          {/* Line width */}
          {(activeTool === "pen" || activeTool === "rect" || activeTool === "circle" || activeTool === "line" || activeTool === "arrow") && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("pdfEditor.stroke", { width: lineWidth })}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {WIDTHS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setLineWidth(w)}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${lineWidth === w ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="rounded-full bg-foreground" style={{ width: Math.min(w * 2.5, 20), height: Math.min(w * 2.5, 20) }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Font size */}
          {activeTool === "text" && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("pdfEditor.fontSizeLabel", { size: fontSize })}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${fontSize === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => setTextBold((prev) => !prev)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${textBold ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                >
                  {t("pdfEditor.bold")}
                </button>
                <button
                  onClick={() => setTextItalic((prev) => !prev)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${textItalic ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                >
                  {t("pdfEditor.italic")}
                </button>
              </div>
            </div>
          )}

          {activeTool === "signature" && (
            <button
              onClick={openSignaturePanel}
              className="w-full py-2 text-xs font-medium text-foreground border border-border rounded-xl hover:bg-muted transition-colors"
            >
              {t("pdfEditor.signProWorkspace")}
            </button>
          )}

          {(activeTool === "image" || selectedAnnotation?.type === "image") && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("pdfEditor.imageBranding")}</p>
              {activeTool === "image" && (
                <>
                  <p className="text-[10px] text-muted-foreground">{t("pdfEditor.nextPlacementOpacity")}</p>
                  <input
                    type="range"
                    min={25}
                    max={100}
                    value={imagePlacementOpacityPct}
                    onChange={(e) => setImagePlacementOpacityPct(Number(e.target.value))}
                    dir="ltr"
                    className="w-full accent-primary"
                  />
                </>
              )}
              {selectedAnnotation?.type === "image" && (
                <>
                  <p className="text-[10px] text-muted-foreground">{t("pdfEditor.opacity")}</p>
                  <div className="flex flex-wrap gap-1">
                    {[1, 0.85, 0.65, 0.45, 0.25].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => patchSelectedImage({ opacity: v })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${Math.abs((selectedAnnotation.opacity ?? 1) - v) < 0.02 ? "border-primary bg-primary/10" : "border-border"}`}
                      >
                        {Math.round(v * 100)}%
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      patchSelectedImage({ rotationDeg: ((selectedAnnotation.rotationDeg ?? 0) + 15) % 360 })
                    }
                    className="w-full py-2 text-xs font-medium border border-border rounded-xl hover:bg-muted"
                  >
                    {t("pdfEditor.rotate15")}
                  </button>
                </>
              )}
            </div>
          )}

          {pageAnnsCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> {t("pdfEditor.layers")}
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
                {sortedPageLayers.map((ann) => (
                  <li
                    key={ann.id}
                    className={`flex items-center justify-between gap-1 rounded-lg border px-2 py-1.5 text-[10px] ${selectedAnnId === ann.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <button
                      type="button"
                      className="truncate text-left font-medium text-foreground flex-1"
                      onClick={() => {
                        setSelectedAnnId(ann.id);
                        setActiveTool("cursor");
                      }}
                    >
                      {ann.type === "whiteout"
                        ? t("pdfEditor.layerWhiteout")
                        : ann.type === "line" && (ann as LineAnnotation).arrow
                          ? t("pdfEditor.tools.arrow")
                          : t(`pdfEditor.tools.${ann.type as "pen" | "text" | "highlight" | "rect" | "circle" | "line" | "image"}`)}
                    </button>
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted"
                        title={t("pdfEditor.layerForward")}
                        onClick={() => pushHistory(bringForward(annotations, ann.id))}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted"
                        title={t("pdfEditor.layerBackward")}
                        onClick={() => pushHistory(sendBackward(annotations, ann.id))}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {t("pdfEditor.statsAnnotations", { count: annotations.length })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("pdfEditor.statsOnPage", { count: pageAnnsCount })}
            </p>
          </div>
          </div>

        </div>
      </div>
      </div>

      {showSignaturePanel ? (
        <div className="hidden lg:block">
          <SignProPanel
            onAdd={handleAddSignature}
            onClose={() => setShowSignaturePanel(false)}
            disabled={stage === "saving"}
            placementDisabled={!pageCanvasReady}
            onError={(msg) => setError(msg)}
          />
        </div>
      ) : null}

      {contentDraft && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{t("pdfEditor.contentModal.title")}</h3>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setContentDraft(null)}>
                ×
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("pdfEditor.contentModal.hint")}
            </p>
            <label className="block text-xs font-semibold text-muted-foreground">{t("pdfEditor.contentModal.replacement")}</label>
            <textarea
              className="w-full min-h-[88px] rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
              value={contentDraft.replace}
              onChange={(e) => setContentDraft((d) => (d ? { ...d, replace: e.target.value } : d))}
              dir="auto"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded-xl border border-border text-sm font-medium" onClick={() => setContentDraft(null)}>
                {t("pdfEditor.contentModal.cancel")}
              </button>
              <button type="button" className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold" onClick={() => void applyContentDraft()}>
                {t("pdfEditor.contentModal.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {lastResult ? (
        <div className="fixed inset-x-0 bottom-0 z-[80] max-h-[min(88dvh,720px)] overflow-y-auto border-t border-border bg-card p-4 shadow-2xl lg:right-6 lg:bottom-6 lg:left-auto lg:max-w-md lg:rounded-2xl lg:border">
          <MobilePostProcessPanel
            currentSlug="pdf-editor"
            onDownload={() => void safeDownloadBlob(lastResult.blob, lastResult.filename)}
            onShare={() => void shareBlob(lastResult.blob, lastResult.filename)}
            onProcessAnother={() => {
              setLastResult(null);
              resetEditorWorkflow();
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

      {/* Page Rearrangement Modal */}
      {showPageReorder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full rounded-3xl border border-white/10 bg-card p-8 shadow-2xl shadow-slate-950/40 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">{t("pdfEditor.rearrangeModal.title")}</h2>
              <button
                onClick={() => setShowPageReorder(false)}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              {t("pdfEditor.rearrangeModal.desc")}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
              {pageOrder.map((pageIndex, currentIndex) => (
                <div
                  key={pageIndex}
                  className="relative group cursor-move"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", currentIndex.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
                    if (fromIndex !== currentIndex) {
                      movePage(fromIndex, currentIndex);
                    }
                  }}
                >
                  <div className="aspect-[3/4] bg-muted rounded-xl flex items-center justify-center border-2 border-transparent group-hover:border-primary transition-colors">
                    {thumbByPage[pageIndex + 1] ? (
                      <img
                        src={thumbByPage[pageIndex + 1]}
                        alt={t("pdfEditor.pageAlt", { n: pageIndex + 1 })}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{t("pdfEditor.pageAlt", { n: pageIndex + 1 })}</span>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {currentIndex + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRearrangePages}
                disabled={stage === "saving"}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {stage === "saving" ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{saveProgress}%</>
                ) : (
                  <><Download className="w-4 h-4" /> {t("pdfEditor.rearrangeModal.saveDownload")}</>
                )}
              </button>
              <button
                onClick={() => setShowPageReorder(false)}
                className="px-6 py-3 border border-border text-sm font-medium rounded-xl hover:bg-muted transition-colors"
              >
                {t("pdfEditor.rearrangeModal.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditorMobileDock
        currentPage={currentPage}
        pageCount={pageCount}
        zoomFactor={zoomFactor}
        onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
        onZoomIn={() => setZoomFactor((z) => Math.min(3, Math.round((z + 0.15) * 100) / 100))}
        onZoomOut={() => setZoomFactor((z) => Math.max(0.5, Math.round((z - 0.15) * 100) / 100))}
        onFitWidth={() => {
          setZoomFactor(1);
          setFitWidthNonce((n) => n + 1);
        }}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        undoDisabled={histIdx <= 0}
        redoDisabled={histIdx >= history.length - 1}
        saveDisabled={stage === "saving"}
        saving={stage === "saving"}
        saveProgress={saveProgress}
      />
    </div>
  );

  return (
    <ToolRenderErrorBoundary onReset={resetEditorWorkflow}>
      <EditorDesktopChrome>{renderEditorWorkspace()}</EditorDesktopChrome>
    </ToolRenderErrorBoundary>
  );
}

