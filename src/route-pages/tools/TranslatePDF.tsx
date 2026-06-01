"use client";

import { useCallback, useMemo, useState } from "react";
import { Languages, Copy } from "lucide-react";
import DropZone from "@/components/DropZone";
import { ToolRouteShell } from "@/components/tools/ToolRouteShell";
import { ProcessingStatusOverlay } from "@/components/processing/ProcessingStatusOverlay";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolPageSeoFooter } from "@/components/seo/ToolPageSeoFooter";
import { logToolError, logToolSuccess, trackInteraction } from "@/utils/logger";
import { toast } from "@/hooks/use-toast";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { Button } from "@/components/ui/button";
import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import { AiDocumentProcessingModal } from "@/components/processing/AiDocumentProcessingModal";
import { AiToolDesktopAdapter } from "@/components/desktop/adapters/AiToolDesktopAdapter";
import { TranslateLanguagePicker } from "@/components/ai/TranslateLanguagePicker";
import { useHybridToolWorkflow } from "@/hooks/useHybridToolWorkflow";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { aiCloudJobOptions, type AiDocumentProcessingMode } from "@/lib/processing/aiCloudOptions";
import { langLabel } from "@/lib/ai/translateLanguages";
import { EnhancedToolResultPanel } from "@/components/history/EnhancedToolResultPanel";
import { ProcessingStatusPanel } from "@/components/processing/ProcessingStatusPanel";
import { useToolProcessingState } from "@/hooks/useToolProcessingState";
import { isLgDesktopViewport, useIsLgDesktop } from "@/hooks/useIsLgDesktop";
import { useHydrated } from "@/hooks/useHydrated";
import type { MasterToolStage } from "@/lib/desktop/types";
import { PLATFORM } from "@/lib/processing/documentScale";

async function extractPdfText(file: File): Promise<string> {
  const pdf = await acquirePdfDocument(file);
  try {
    let fullText = "";
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item) => item && typeof (item as { str?: string }).str === "string")
        .map((item) => (item as { str: string }).str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      fullText += `--- Page ${pageIndex} ---\n${pageText}\n\n`;
    }
    return fullText.trim();
  } finally {
    releasePdfDocument(file);
  }
}

export default function TranslatePDF() {
  const hydrated = useHydrated();
  const isLgDesktop = useIsLgDesktop();
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hybrid = useHybridToolWorkflow({ toolSlug: "translate-pdf" });
  const premiumCloud = usePremiumCloudRun("translate-pdf", "Translate PDF");
  const translateLifecycle = premiumCloud.lifecycle;
  const ocrCloud = usePremiumCloudRun("ocr-pdf", "OCR PDF");
  const ocrLifecycle = ocrCloud.lifecycle;
  const { usage } = useProcessingMode();
  const { isSignedIn } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const aiTrialRemaining = usage?.aiTrial?.trialRemaining ?? 1;

  const file = hybrid.file;
  const cloudStatus =
    premiumCloud.status !== "idle" ? premiumCloud.status : ocrCloud.status;
  const cloudProgress = Math.max(premiumCloud.progress, ocrCloud.progress);
  const cloudError = premiumCloud.error ?? ocrCloud.error;
  const busy = cloudStatus === "queued" || cloudStatus === "processing";

  const desktopStage: MasterToolStage = resultBlob
    ? "done"
    : busy
      ? "processing"
      : file
        ? "configure"
        : "upload";

  const processingUi = useToolProcessingState({
    hasFile: Boolean(file),
    cloudStatus,
    uploadProgress: cloudProgress,
    localStage: resultBlob ? "done" : extractedText ? "done" : "configure",
  });

  const selectedFileLabel = useMemo(() => {
    if (!file) return "No PDF selected yet.";
    return `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  }, [file]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const incoming = files[0];
      if (!incoming) return;
      setError(null);
      setExtractedText(null);
      setResultBlob(null);
      trackInteraction("translate_pdf_file_uploaded", {
        tool_slug: "translate-pdf",
        file_name: incoming.name,
        file_size: incoming.size,
      });
      await hybrid.acceptUpload(incoming, { openModeModal: !isLgDesktopViewport() });
    },
    [hybrid],
  );

  const runBrowserExtract = useCallback(async () => {
    if (!file) return;
    setError(null);
    setExtractedText(null);
    try {
      await runTieredThenCleanup([file], { onProgress: () => undefined }, async () => {
        const text = await extractPdfText(file);
        setExtractedText(text);
        logToolSuccess("translate-pdf", { flow: "local_text_extract", text_length: text.length });
        toast({ title: "Text extracted", description: "Copy text or use AI Plus to translate the PDF." });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed.";
      setError(message);
      logToolError("translate-pdf", "text_extract", err instanceof Error ? err : new Error(message), {
        has_file: !!file,
      });
    }
  }, [file]);

  const runOcrCloud = useCallback(async () => {
    if (!file) return;
    try {
      const pages = await getPDFPageCount(file);
      const { blob, filename } = await ocrCloud.runPremium(file, pages, {
        toolSlug: "ocr-pdf",
        processingMode: "ocr_cloud",
      });
      setResultBlob(blob);
      toast({
        title: "Searchable PDF ready",
        description: `${filename} — now you can run AI Plus translate on this file.`,
      });
    } catch (e) {
      toast({
        title: "OCR failed",
        description: e instanceof Error ? e.message : "Cloud OCR unavailable.",
        variant: "destructive",
      });
    }
  }, [file, ocrCloud]);

  const runAiTranslate = useCallback(async () => {
    if (!file) return;
    if (file.size > PLATFORM.maxFileBytesStandard) {
      toast({
        title: "File too large",
        description: "Use a smaller PDF or upgrade for larger cloud jobs.",
        variant: "destructive",
      });
      return;
    }
    const pages = await getPDFPageCount(file);
    if (pages > PLATFORM.maxPagesStandard) {
      toast({
        title: "Too many pages",
        description: `AI trial supports up to ${PLATFORM.maxPagesStandard} pages.`,
        variant: "destructive",
      });
      return;
    }
    try {
      const { blob, filename } = await premiumCloud.runPremium(file, pages, {
        ...aiCloudJobOptions({
          toolSlug: "translate-pdf",
          processingMode: "ai_plus",
          jobType: "translate",
          sourceLang: langLabel(sourceLang),
          targetLang: langLabel(targetLang),
        }),
      });
      setResultBlob(blob);
      logToolSuccess("translate-pdf", { flow: "ai_translate", target: targetLang });
      toast({ title: "Translated PDF ready", description: filename });
    } catch (e) {
      toast({
        title: "Translation failed",
        description: e instanceof Error ? e.message : "AI unavailable.",
        variant: "destructive",
      });
    }
  }, [file, premiumCloud, sourceLang, targetLang]);

  const onModeChoose = useCallback(
    async (mode: AiDocumentProcessingMode) => {
      hybrid.setModeModalOpen(false);
      if (mode === "browser") {
        await runBrowserExtract();
        return;
      }
      if (mode === "ocr_cloud") {
        await runOcrCloud();
        return;
      }
      await runAiTranslate();
    },
    [runAiTranslate, runBrowserExtract, runOcrCloud, hybrid],
  );

  const handleCopy = useCallback(() => {
    if (!extractedText) return;
    void navigator.clipboard.writeText(extractedText);
    toast({ title: "Copied", description: "Extracted text copied." });
  }, [extractedText]);

  const clearFile = useCallback(() => {
    if (busy) return;
    translateLifecycle.reset();
    ocrLifecycle.reset();
    setResultBlob(null);
    setExtractedText(null);
    setError(null);
    void hybrid.clearSession();
  }, [busy, hybrid, ocrLifecycle, translateLifecycle]);

  const languageSettings = (
    <TranslateLanguagePicker
      sourceLang={sourceLang}
      targetLang={targetLang}
      onSourceChange={setSourceLang}
      onTargetChange={setTargetLang}
    />
  );

  const handleDesktopDownload = useCallback(() => {
    const url = translateLifecycle.objectUrl ?? ocrLifecycle.objectUrl;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `translated_${targetLang}.pdf`;
    a.click();
  }, [ocrLifecycle.objectUrl, targetLang, translateLifecycle.objectUrl]);

  const desktopExperience = (
    <AiToolDesktopAdapter
      toolSlug="translate-pdf"
      stage={desktopStage}
      file={file}
      progress={cloudProgress}
      resultBlob={resultBlob}
      resultFilename={`translated_${targetLang}.pdf`}
      objectUrl={translateLifecycle.objectUrl ?? ocrLifecycle.objectUrl}
      onFiles={handleFiles}
      onReset={clearFile}
      onDownload={handleDesktopDownload}
      isSignedIn={isSignedIn}
      aiTrialAvailable={aiTrialRemaining > 0 || (usage?.credits?.available ?? 0) > 0}
      showBrowser
      settings={languageSettings}
      onRequestSignIn={() =>
        requestSignIn({
          reason: "Sign in to use Translate PDF on Trusted Cloud.",
          deferredAction: "premium-restore",
          toolSlug: "translate-pdf",
        })
      }
      onChooseMode={onModeChoose}
    />
  );

  const mobileExperience = (
    <MobileToolLayout
      slug="translate-pdf"
      toolLabel="Translate PDF"
      title="Translate PDF"
      settingsPanel={languageSettings}
      processButton={
        <Button
          type="button"
          className="w-full gap-2"
          disabled={!file || busy}
          onClick={() => hybrid.setModeModalOpen(true)}
        >
          <Languages className="h-4 w-4" />
          {busy ? "Processing…" : "Choose processing & run"}
        </Button>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <ProcessingStatusOverlay active={busy} type="ai" progress={cloudProgress}>
        <DropZone
          onFiles={(f) => void handleFiles(f)}
          accept=".pdf,application/pdf"
          multiple={false}
          label="Upload PDF"
        />
      </ProcessingStatusOverlay>
      <p className="mt-3 text-xs text-muted-foreground">{selectedFileLabel}</p>
      {extractedText ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex justify-between gap-2">
            <h2 className="text-sm font-semibold">Extracted text</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-1">
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </div>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">{extractedText}</pre>
        </div>
      ) : null}
      {resultBlob ? (
        <div className="mt-4">
          <EnhancedToolResultPanel
            blob={resultBlob}
            filename={`translated_${targetLang}.pdf`}
            toolSlug="translate-pdf"
            objectUrl={translateLifecycle.objectUrl ?? ocrLifecycle.objectUrl}
            secondsLeft={translateLifecycle.secondsLeft || ocrLifecycle.secondsLeft}
            cloudExpired={translateLifecycle.cloudExpired || ocrLifecycle.cloudExpired}
            persisting={translateLifecycle.persisting || ocrLifecycle.persisting}
            jobId={translateLifecycle.jobId ?? ocrLifecycle.jobId}
            sourceFile={file}
            onProcessAnother={() => void clearFile()}
          />
        </div>
      ) : null}
      <ProcessingStatusPanel
        phase={processingUi.phase}
        progress={cloudProgress}
        cloudStatus={cloudStatus}
        error={cloudError}
      />
    </MobileToolLayout>
  );

  return (
    <>
      <ToolRouteShell
        slug="translate-pdf"
        toolName="Translate PDF"
        seoTitle="Translate PDF — PDFTrusted"
        seoDescription="Translate PDFs with browser extract, Trusted Cloud OCR, or AI Plus via OpenRouter."
        seoKeywords="translate PDF, Hindi English PDF, PDFTrusted AI"
        mobileSeoFooter={false}
      >
        {!hydrated || !isLgDesktop ? mobileExperience : desktopExperience}
      </ToolRouteShell>

      <AiDocumentProcessingModal
        open={hybrid.modeModalOpen}
        onOpenChange={hybrid.setModeModalOpen}
        toolSlug="translate-pdf"
        file={file}
        aiTrialRemaining={aiTrialRemaining}
        onCancel={() => hybrid.setModeModalOpen(false)}
        onChoose={onModeChoose}
      />

      {!hydrated || !isLgDesktop ? (
        <div className="lg:hidden px-4 pb-10">
          <ToolPageSeoFooter slug="translate-pdf" toolName="Translate PDF" className="space-y-6" />
        </div>
      ) : null}
    </>
  );
}
