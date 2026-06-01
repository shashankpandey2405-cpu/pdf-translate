"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { fetchEnhancedResultBlob } from "@/lib/enhanced/fetchResultBlob";
import { useEnhancedJob } from "@/hooks/useEnhancedJob";
import { usePremium } from "@/context/PremiumContext";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useAuthPrompt, stashAuthIntent } from "@/context/AuthPromptContext";
import { stashPremiumFlow, premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { toast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import { SmartScanResultFocus } from "@/components/ai/smartscan/SmartScanResultFocus";
import { pdfToWord, getWordFilename } from "@/tools/pdf-to-word/logic";
import {
  isSmartScanSeoAlias,
  smartScanMaxPages,
  SMART_SCAN_FREE_MAX_PAGES,
  SMART_SCAN_PREMIUM_MAX_PAGES,
} from "@/lib/ai/smartScanLimits";
import { getLocalizedToolSeoBundle } from "@/lib/seo/localizedToolSeo";
import { useTranslation } from "react-i18next";
import { AiCompactFileStep } from "@/components/ai/workflow/AiCompactFileStep";
import { AiProcessingFocus } from "@/components/ai/workflow/AiProcessingFocus";
import { AiFocusShell } from "@/components/ai/workflow/AiFocusShell";
import { ToolErrorState } from "@/components/tools/ToolErrorState";

const ACCEPT_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export default function SmartScanAi() {
  const { i18n } = useTranslation();
  const [location] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [wordBusy, setWordBusy] = useState(false);

  const seoSlug = useMemo(() => {
    const path = location.replace(/^\//, "").split("?")[0] ?? "";
    return isSmartScanSeoAlias(path) ? path : "smart-scan-ai";
  }, [location]);

  const enhancedJob = useEnhancedJob("smart-scan-ai");
  const { isPremium } = usePremium();
  const seoBundle = getLocalizedToolSeoBundle(i18n.language, seoSlug);
  const maxPages = smartScanMaxPages(isPremium);
  const pagesToProcess =
    pdfPageCount !== null ? Math.min(pdfPageCount, maxPages) : file?.type === "application/pdf" ? null : 1;
  const { resolveSignedIn } = useAuthAction();
  const { requestSignIn } = useAuthPrompt();
  const processFileRef = useRef<File | null>(null);

  const busy = enhancedJob.status === "queued" || enhancedJob.status === "processing";
  const hasResult = Boolean(resultBlob);

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
          toast({ title: "Scan complete", description: "Your reconstructed document is ready." });
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

  const progress =
    enhancedJob.status === "queued" ? 20 : Math.min(95, enhancedJob.progress ?? 45);

  const processingSteps = [
    "Analyzing document structure…",
    "Detecting layout, text, and tables…",
    "Reconstructing clean document…",
  ];

  const mainContent = (() => {
    if (busy) {
      return (
        <AiProcessingFocus
          title="Smart Scan AI"
          progress={progress}
          steps={processingSteps}
        />
      );
    }

    if (hasResult && file) {
      return (
        <SmartScanResultFocus
          fileName={file.name}
          pageCount={pdfPageCount}
          jobId={jobId}
          baseFilename={resultName}
          onRevisedPdf={handleRevisedPdf}
          onDownload={downloadResult}
          onExportWord={() => void exportWord()}
          wordBusy={wordBusy}
          onStartOver={startOver}
        />
      );
    }

    if (file) {
      return (
        <AiFocusShell>
          <div className="space-y-4">
            <AiCompactFileStep
              file={file}
              onContinue={() => void startSmartScan()}
              onRemove={startOver}
              continueLabel="Start Scan"
            />
            {pagesToProcess !== null && pdfPageCount !== null && pdfPageCount > maxPages ? (
              <p className="text-center text-xs text-muted-foreground">
                Processing {pagesToProcess} of {pdfPageCount} pages on your plan.
              </p>
            ) : null}
            {enhancedJob.error ? (
              <ToolErrorState
                title="Smart Scan failed"
                message={enhancedJob.error}
                onRetry={() => void startSmartScan()}
                className="py-4"
              />
            ) : null}
          </div>
        </AiFocusShell>
      );
    }

    return (
      <AiFocusShell>
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-3">
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
          <div className="flex flex-wrap justify-center gap-1.5">
            {["JPG", "PNG", "WEBP", "PDF", "Scans", "Photos"].map((tag) => (
              <span key={tag} className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </AiFocusShell>
    );
  })();

  const mobileContent = (
    <MobileToolLayout slug="smart-scan-ai" toolLabel="Smart Scan AI" title="Smart Scan AI">
      {!file && !busy && !hasResult ? (
        <div className="p-4">
          <ToolUploadSlot
            files={[]}
            onFiles={handleFiles}
            accept={ACCEPT_TYPES}
            multiple={false}
            label="Upload photo or PDF"
            sublabel="Scans, photos, screenshots, handwriting"
          />
        </div>
      ) : (
        mainContent
      )}
    </MobileToolLayout>
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
      <ToolPageSplit
        desktop={<div className="flex min-h-[calc(100vh-4rem)] flex-col">{mainContent}</div>}
        mobile={mobileContent}
      />
    </ToolRenderErrorBoundary>
  );
}
