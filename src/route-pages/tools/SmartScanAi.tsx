"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { DesktopMiniSidebar } from "@/components/desktop/DesktopMiniSidebar";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { PdfScrollPreview } from "@/components/tools/PdfScrollPreview";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobileAiPreviewModal } from "@/components/mobile/MobileAiPreviewModal";
import { fetchEnhancedResultBlob } from "@/lib/enhanced/fetchResultBlob";
import { useEnhancedJob } from "@/hooks/useEnhancedJob";
import { usePremium } from "@/context/PremiumContext";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useAuthPrompt, stashAuthIntent } from "@/context/AuthPromptContext";
import { DeferredStartPanel } from "@/components/conversion/DeferredStartPanel";
import { stashPremiumFlow, premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { ToolErrorState } from "@/components/tools/ToolErrorState";
import {
  Wand2,
  Download,
  RotateCcw,
  Sparkles,
  FileText,
  Loader2,
} from "lucide-react";
import { SmartScanChatPanel } from "@/components/ai/smartscan/SmartScanChatPanel";
import { pdfToWord, getWordFilename } from "@/tools/pdf-to-word/logic";
import {
  isSmartScanSeoAlias,
  smartScanMaxPages,
  SMART_SCAN_FREE_MAX_PAGES,
  SMART_SCAN_PREMIUM_MAX_PAGES,
} from "@/lib/ai/smartScanLimits";
import { getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { useTranslation } from "react-i18next";

const ACCEPT_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export default function SmartScanAi() {
  const { i18n } = useTranslation();
  const [location] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [wordBusy, setWordBusy] = useState(false);

  const seoSlug = useMemo(() => {
    const path = location.replace(/^\//, "").split("?")[0] ?? "";
    return isSmartScanSeoAlias(path) ? path : "smart-scan-ai";
  }, [location]);

  const enhancedJob = useEnhancedJob("smart-scan-ai");
  const { isPremium, isSignedIn } = usePremium();
  const seoBundle = getLocalizedToolSeoBundle(i18n.language, seoSlug);
  const maxPages = smartScanMaxPages(isPremium);
  const pagesToProcess =
    pdfPageCount !== null ? Math.min(pdfPageCount, maxPages) : file?.type === "application/pdf" ? null : 1;
  const { resolveSignedIn } = useAuthAction();
  const { requestSignIn } = useAuthPrompt();
  const processFileRef = useRef<File | null>(null);

  const busy = enhancedJob.status === "queued" || enhancedJob.status === "processing";

  const runSmartScanWithFile = useCallback(
    async (f: File) => {
      try {
        let pages: number | null = null;
        if (f.type === "application/pdf") {
          const total = await getPDFPageCount(f);
          pages = Math.min(total, smartScanMaxPages(isPremium));
          setPdfPageCount(total);
        } else {
          pages = 1;
          setPdfPageCount(1);
        }

        const result = await enhancedJob.run(f, pages, {
          processingMode: "ai_plus",
          aiTier: "standard",
          toolSlug: "smart-scan-ai",
        });

        if (result.downloadUrl) {
          const blob = await fetchEnhancedResultBlob(result.downloadUrl, { jobId: result.jobId });
          setResultBlob(blob);
          setJobId(result.jobId);
          const originalName = f.name.replace(/\.[^.]+$/, "");
          setResultName(`${originalName}_reconstructed.pdf`);
          toast({ title: "Reconstruction complete", description: "Chat below to edit or ask AI about your document." });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Processing failed";
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
    [enhancedJob, isPremium],
  );

  const startSmartScan = useCallback(async () => {
    const f = file ?? processFileRef.current;
    if (!f) return;

    if (!(await resolveSignedIn())) {
      const stashed = await stashPremiumFlow({
        blob: f,
        fileName: f.name,
        mimeType: f.type,
        toolSlug: "smart-scan-ai",
        mode: "enhanced",
      });
      if (!stashed) {
        toast({ title: "Could not save file", variant: "destructive" });
        return;
      }
      stashAuthIntent({
        returnPath: typeof window !== "undefined" ? window.location.pathname : "/",
        toolSlug: "smart-scan-ai",
        autoStart: true,
        deferredAction: "premium-restore",
        reason: SIGN_IN_REASON.smartScan,
        tone: "ai",
      });
      requestSignIn({
        reason: SIGN_IN_REASON.smartScan,
        tone: "ai",
        deferredAction: "premium-restore",
        toolSlug: "smart-scan-ai",
        autoStart: true,
      });
      return;
    }

    await runSmartScanWithFile(f);
  }, [file, resolveSignedIn, requestSignIn, runSmartScanWithFile]);

  usePremiumFlowRestore(
    "smart-scan-ai",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      processFileRef.current = restored;
      setFile(restored);
      setResultBlob(null);
      setJobId(null);
    },
    {
      onAutoStart: async () => {
        const f = processFileRef.current;
        if (f) await runSmartScanWithFile(f);
      },
    },
  );

  useEffect(() => {
    if (!resultBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(resultBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [resultBlob]);

  const handleRevisedPdf = useCallback((blob: Blob, name: string) => {
    setResultBlob(blob);
    setResultName(name);
  }, []);

  const exportWord = useCallback(async () => {
    if (!resultBlob) return;
    setWordBusy(true);
    try {
      const pdfFile = new File([resultBlob], resultName || "document.pdf", { type: "application/pdf" });
      const bytes = await pdfToWord(pdfFile);
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/rtf" });
      void safeDownloadBlob(blob, getWordFilename(pdfFile));
      toast({ title: "Word export ready", description: "Downloaded editable document (.doc)." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Export failed";
      toast({ title: "Word export failed", description: msg, variant: "destructive" });
    } finally {
      setWordBusy(false);
    }
  }, [resultBlob, resultName]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      processFileRef.current = f;
      setFile(f);
      setResultBlob(null);
      setJobId(null);
      if (f.type === "application/pdf") {
        try {
          const total = await getPDFPageCount(f);
          setPdfPageCount(total);
          const cap = smartScanMaxPages(isPremium);
          if (total > cap) {
            toast({
              title: `${total}-page PDF`,
              description: isPremium
                ? `Premium processes up to ${SMART_SCAN_PREMIUM_MAX_PAGES} pages per scan. First ${cap} pages will be reconstructed.`
                : `Free plan: first ${SMART_SCAN_FREE_MAX_PAGES} pages only. Upgrade for ${SMART_SCAN_PREMIUM_MAX_PAGES} pages.`,
            });
          }
        } catch {
          setPdfPageCount(null);
        }
      } else {
        setPdfPageCount(1);
      }
    },
    [isPremium],
  );

  const downloadResult = () => {
    if (!resultBlob) return;
    void safeDownloadBlob(resultBlob, resultName || "reconstructed.pdf");
  };

  const startOver = () => {
    processFileRef.current = null;
    setFile(null);
    setResultBlob(null);
    setResultName("");
    setJobId(null);
    setPdfPageCount(null);
  };

  const progressLabel = enhancedJob.progress <= 20
    ? "Uploading document…"
    : enhancedJob.progress <= 40
      ? "AI is analyzing document structure…"
      : enhancedJob.progress <= 70
        ? "Detecting layout, text, tables…"
        : enhancedJob.progress <= 90
          ? "Reconstructing clean document…"
          : "Finalizing…";

  const mobileWorkflowStep: ToolWorkflowStepId = !file
    ? "upload"
    : resultBlob
      ? "done"
      : busy
        ? "process"
        : "configure";

  const mobileProcessButton = !file ? null : resultBlob ? null : !busy ? (
    <button type="button" onClick={() => void startSmartScan()} className={TOOL_PRIMARY_BTN}>
      <Sparkles className="h-5 w-5" />
      {isSignedIn ? "Start AI reconstruction" : "Continue with Google — Start scan"}
    </button>
  ) : null;

  const mobilePage = (
      <MobileToolLayout
        slug="smart-scan-ai"
        toolLabel="Smart Scan AI"
        title="Smart Scan AI"
        workflowStep={mobileWorkflowStep}
        processButton={mobileProcessButton}
        postProcessPanel={
          resultBlob ? (
            <div className="space-y-3">
              <MobilePostProcessPanel
                currentSlug="smart-scan-ai"
                onDownload={downloadResult}
                onShare={() => void shareBlob(resultBlob, resultName || "reconstructed.pdf")}
                onProcessAnother={startOver}
                downloadLabel="Download PDF"
              />
              <Button variant="outline" disabled={wordBusy} onClick={() => void exportWord()} className="w-full gap-2">
                {wordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Export Word
              </Button>
            </div>
          ) : undefined
        }
      >
        {!file ? (
          <>
            <ToolUploadSlot
              files={[]}
              onFiles={handleFiles}
              accept={ACCEPT_TYPES}
              multiple={false}
              label="Upload photo or PDF"
              sublabel="Scans, photos, screenshots, handwriting"
            />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["JPG", "PNG", "WEBP", "PDF", "Scans", "Photos"].map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : resultBlob ? (
          <div className="flex flex-1 flex-col gap-4 p-3">
            <MobileAiPreviewModal preview={{ kind: "blob", blob: resultBlob, filename: resultName }} />
            <SmartScanChatPanel jobId={jobId} baseFilename={resultName} onRevisedPdf={handleRevisedPdf} className="min-h-[360px] flex-1" />
          </div>
        ) : (
          <div className="space-y-4">
            <ToolUploadedFileCard file={file} onRemove={startOver} className="border-violet-500/25" />
            {pagesToProcess !== null && pdfPageCount !== null ? (
              <p className="text-center text-xs text-muted-foreground">
                {pagesToProcess} of {pdfPageCount} page{pdfPageCount === 1 ? "" : "s"} selected
              </p>
            ) : null}
            {busy && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-50 px-3 py-2.5 text-sm dark:bg-violet-950/20">
                  <span className="text-violet-600" aria-hidden>✨</span>
                  <span className="text-violet-700 dark:text-violet-300">{progressLabel}</span>
                </div>
                <div className="overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${enhancedJob.progress}%` }}
                  />
                </div>
              </div>
            )}
            {!busy && !resultBlob && (
              <DeferredStartPanel
                variant="ai"
                guestCta="Continue with Google — Start scan"
                signedInCta="Start AI reconstruction"
                onStart={() => void startSmartScan()}
                isSignedIn={isSignedIn}
              />
            )}
            {!busy && enhancedJob.error ? (
              <ToolErrorState title="Smart Scan failed" message={enhancedJob.error} onRetry={() => void startSmartScan()} className="py-6" />
            ) : null}
          </div>
        )}
      </MobileToolLayout>
  );

  const desktopPage = (
      <div className="hidden lg:flex h-[calc(100dvh-4rem)] overflow-hidden">
        <DesktopMiniSidebar activeSlug="smart-scan-ai" />
        {!file ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-1 flex-col items-center justify-center p-8">
              <div className="w-full max-w-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                    <Wand2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Smart Scan AI</h1>
                    <p className="text-sm text-muted-foreground">Reconstruct photos & scans into editable PDFs</p>
                  </div>
                </div>
                <ToolUploadSlot
                  files={[]}
                  onFiles={handleFiles}
                  accept={ACCEPT_TYPES}
                  multiple={false}
                  label="Upload photo or PDF"
                  sublabel="JPG, PNG, WEBP, PDF, scans, handwriting"
                />
              </div>
            </div>
          </div>
        ) : resultBlob ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
              <p className="truncate text-sm font-medium">{resultName}</p>
              <div className="flex shrink-0 gap-2">
                <Button onClick={downloadResult} className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button variant="outline" disabled={wordBusy} onClick={() => void exportWord()} className="h-9 rounded-xl text-xs">
                  {wordBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  Word
                </Button>
                <Button variant="outline" onClick={startOver} className="h-9 rounded-xl text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  New scan
                </Button>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_min(380px,34%)]">
              <div className="flex min-h-0 flex-col overflow-hidden bg-muted/15 p-3">
                <PdfScrollPreview
                  key={resultName + String(resultBlob.size)}
                  blob={resultBlob}
                  filename={resultName}
                  layout="paged"
                  fullPage
                  className="h-full min-h-0"
                  maxWidth={720}
                />
              </div>
              <SmartScanChatPanel jobId={jobId} baseFilename={resultName} onRevisedPdf={handleRevisedPdf} className="h-full min-h-0 rounded-none border-0 border-l border-border" />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8">
            <div className="w-full max-w-md space-y-5 text-center">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              {busy ? (
                <div className="space-y-3 text-left">
                  <ProcessingStatus type="ai" label={progressLabel} />
                  <div className="overflow-hidden rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${enhancedJob.progress}%` }} />
                  </div>
                </div>
              ) : enhancedJob.error ? (
                <ToolErrorState title="Smart Scan failed" message={enhancedJob.error} onRetry={() => void startSmartScan()} />
              ) : (
                <>
                  <Button onClick={() => void startSmartScan()} className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-base font-bold">
                    <Sparkles className="h-5 w-5" />
                    {isSignedIn ? "Start AI reconstruction" : "Continue with Google — Start scan"}
                  </Button>
                  <button type="button" onClick={startOver} className="text-xs text-muted-foreground underline">
                    Choose a different file
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
  );

  return (
    <ToolRenderErrorBoundary onReset={startOver}>
      <ToolSEO
        title={
          seoBundle?.title ??
          "Smart Scan AI — Document Reconstruction from Photos & Scans | PDFTrusted"
        }
        description={
          seoBundle?.description ??
          "Upload any photo, scan, screenshot, or handwritten note. AI reconstructs it into a clean, structured, searchable, editable professional PDF."
        }
        keywords={seoBundle?.keywords}
        slug={seoSlug}
      />
      <ToolPageSplit desktop={desktopPage} mobile={mobilePage} />
    </ToolRenderErrorBoundary>
  );
}
