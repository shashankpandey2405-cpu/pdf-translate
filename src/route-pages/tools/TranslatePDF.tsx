"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Languages, Copy } from "lucide-react";
import DropZone from "@/components/DropZone";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { ToolRouteShell } from "@/components/tools/ToolRouteShell";
import { ProcessingStatusOverlay } from "@/components/processing/ProcessingStatusOverlay";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { DeferredStartPanel } from "@/components/conversion/DeferredStartPanel";
import { logToolError, logToolSuccess, trackInteraction } from "@/utils/logger";
import { toast } from "@/hooks/use-toast";
import { runTieredThenCleanup } from "@/lib/runTieredStaging";
import { Button } from "@/components/ui/button";
import { acquirePdfDocument, releasePdfDocument } from "@/lib/pdfjsClient";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { AiToolDesktopAdapter } from "@/components/desktop/adapters/AiToolDesktopAdapter";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { TranslateLanguagePicker } from "@/components/ai/TranslateLanguagePicker";
import { TranslateLayoutPicker } from "@/components/ai/TranslateLayoutPicker";
import { useHybridToolWorkflow } from "@/hooks/useHybridToolWorkflow";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import {
  aiCloudJobOptions,
  type AiDocumentProcessingMode,
  type RecommendedTranslateEngine,
  type TranslateLayoutMode,
} from "@/lib/processing/aiCloudOptions";
import { analyzePdfDocument } from "@/lib/processing/documentAnalysis";
import { langLabel } from "@/lib/ai/translateLanguages";
import { EnhancedToolResultPanel } from "@/components/history/EnhancedToolResultPanel";
import { ProcessingStatusPanel } from "@/components/processing/ProcessingStatusPanel";
import { useToolProcessingState } from "@/hooks/useToolProcessingState";
import type { MasterToolStage } from "@/lib/desktop/types";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { useAiCreditEstimate } from "@/hooks/useAiCreditEstimate";
import { validateAiUploadAgainstEstimate } from "@/lib/ai/validateAiUpload";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { stashPremiumFlow, premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";

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
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingModeRef = useRef<AiDocumentProcessingMode>("classic_mt");
  const [translatedReady, setTranslatedReady] = useState(false);
  const [layoutMode, setLayoutMode] = useState<TranslateLayoutMode>("keep_layout");
  const [recommendedEngine, setRecommendedEngine] = useState<RecommendedTranslateEngine>("classic");
  const [engineReason, setEngineReason] = useState<string>("");
  const [analyzeBusy, setAnalyzeBusy] = useState(false);

  const hybrid = useHybridToolWorkflow({ toolSlug: "translate-pdf" });
  const premiumCloud = usePremiumCloudRun("translate-pdf", "Translate PDF");
  const translateLifecycle = premiumCloud.lifecycle;
  const { usage } = useProcessingMode();
  const { isSignedIn } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const aiTrialRemaining = usage?.aiTrial?.trialRemaining ?? 1;

  const file = hybrid.file;
  const processingModeForEstimate: "ai_plus" | "classic_mt" =
    recommendedEngine === "ai" ? "ai_plus" : "classic_mt";

  const { estimate: creditEstimate } = useAiCreditEstimate(
    "translate-pdf",
    file,
    Boolean(file) && isSignedIn,
    processingModeForEstimate,
  );
  const cloudStatus = premiumCloud.status;
  const cloudProgress = premiumCloud.progress;
  const cloudError = premiumCloud.error;
  const busy = cloudStatus === "queued" || cloudStatus === "processing";

  const desktopStage: MasterToolStage = resultBlob && translatedReady
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
    localStage: resultBlob && translatedReady ? "done" : "configure",
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
      setTranslatedReady(false);
      trackInteraction("translate_pdf_file_uploaded", {
        tool_slug: "translate-pdf",
        file_name: incoming.name,
        file_size: incoming.size,
      });
      await hybrid.acceptUpload(incoming, { openModeModal: false });
      setAnalyzeBusy(true);
      try {
        const analysis = await analyzePdfDocument(incoming);
        const engine: RecommendedTranslateEngine = analysis.likelyScanned
          ? "ai"
          : "classic";
        setRecommendedEngine(engine);
        setEngineReason(analysis.reason);
      } catch {
        setRecommendedEngine("classic");
        setEngineReason("Upload a digital PDF for Classic layout-preserving translation.");
      } finally {
        setAnalyzeBusy(false);
      }
    },
    [hybrid],
  );

  const stashCloudStart = useCallback(
    async (mode?: AiDocumentProcessingMode) => {
      if (!file) return;
      const pm = mode ?? (recommendedEngine === "ai" ? "ai_plus" : "classic_mt");
      pendingModeRef.current = pm;
      await stashPremiumFlow({
        blob: file,
        fileName: file.name,
        mimeType: file.type || "application/pdf",
        toolSlug: "translate-pdf",
        mode: "enhanced",
        settings: {
          processingMode: pm,
          sourceLang,
          targetLang,
          layoutMode,
          recommendedEngine,
        },
      });
      requestSignIn({
        reason: SIGN_IN_REASON.translate,
        tone: "cloud",
        deferredAction: "premium-restore",
        toolSlug: "translate-pdf",
        autoStart: true,
      });
    },
    [file, requestSignIn, sourceLang, targetLang, layoutMode, recommendedEngine],
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

  const runCloudTranslate = useCallback(async () => {
    if (!file) return;
    const pages = await getPDFPageCount(file);
    const precheck = validateAiUploadAgainstEstimate(creditEstimate, pages, file.size);
    if (!precheck.ok) {
      toast({
        title: precheck.title,
        description: precheck.description,
        variant: "destructive",
      });
      return;
    }
    const mode: AiDocumentProcessingMode =
      recommendedEngine === "ai" ? "ai_plus" : "classic_mt";
    try {
      const { blob, filename } = await premiumCloud.runPremium(file, pages, {
        ...aiCloudJobOptions({
          toolSlug: "translate-pdf",
          processingMode: mode,
          jobType: "translate",
          layoutMode,
          sourceLang: langLabel(sourceLang),
          targetLang: langLabel(targetLang),
          sourceLangCode: sourceLang,
          targetLangCode: targetLang,
        }),
      });
      setResultBlob(blob);
      setTranslatedReady(true);
      logToolSuccess("translate-pdf", {
        flow: mode === "classic_mt" ? "classic_translate" : "ai_translate",
        target: targetLang,
      });
      toast({
        title: "Translated PDF ready",
        description:
          mode === "classic_mt"
            ? `${filename} · Classic (open-source MT)`
            : filename,
      });
    } catch (e) {
      toast({
        title: "Translation failed",
        description: e instanceof Error ? e.message : "Translation unavailable.",
        variant: "destructive",
      });
    }
  }, [
    file,
    premiumCloud,
    sourceLang,
    targetLang,
    layoutMode,
    creditEstimate,
    recommendedEngine,
  ]);

  const onModeChoose = useCallback(
    async (mode: AiDocumentProcessingMode) => {
      hybrid.setModeModalOpen(false);
      if (mode === "browser") {
        await runBrowserExtract();
        return;
      }
      if (mode === "ocr_cloud") {
        toast({
          title: "Use translate to change language",
          description: "OCR only makes text searchable. Use Classic or AI translate after OCR PDF if needed.",
        });
        return;
      }
      if (mode === "ai_plus" || mode === "classic_mt") {
        setRecommendedEngine(mode === "ai_plus" ? "ai" : "classic");
        await runCloudTranslate();
        return;
      }
      await runCloudTranslate();
    },
    [runCloudTranslate, runBrowserExtract, hybrid],
  );

  const onModeChooseRef = useRef(onModeChoose);
  onModeChooseRef.current = onModeChoose;

  usePremiumFlowRestore(
    "translate-pdf",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      hybrid.setFile(restored);
      await hybrid.persistFile(restored);
      const settings = flow.settings as {
        processingMode?: AiDocumentProcessingMode;
        sourceLang?: string;
        targetLang?: string;
        layoutMode?: TranslateLayoutMode;
        recommendedEngine?: RecommendedTranslateEngine;
      };
      if (settings?.sourceLang) setSourceLang(settings.sourceLang);
      if (settings?.targetLang) setTargetLang(settings.targetLang);
      if (settings?.layoutMode === "keep_layout" || settings?.layoutMode === "text_only") {
        setLayoutMode(settings.layoutMode);
      }
      if (settings?.processingMode) pendingModeRef.current = settings.processingMode;
      if (settings?.recommendedEngine === "ai" || settings?.recommendedEngine === "classic") {
        setRecommendedEngine(settings.recommendedEngine);
      }
    },
    {
      onAutoStart: async () => {
        await onModeChooseRef.current(pendingModeRef.current);
      },
    },
  );

  const handleCopy = useCallback(() => {
    if (!extractedText) return;
    void navigator.clipboard.writeText(extractedText);
    toast({ title: "Copied", description: "Extracted text copied." });
  }, [extractedText]);

  const clearFile = useCallback(() => {
    if (busy) return;
    translateLifecycle.reset();
    setResultBlob(null);
    setTranslatedReady(false);
    setExtractedText(null);
    setError(null);
    void hybrid.clearSession();
  }, [busy, hybrid, translateLifecycle]);

  const languageSettings = (
    <div className="space-y-4">
      <TranslateLanguagePicker
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceChange={setSourceLang}
        onTargetChange={setTargetLang}
      />
      <TranslateLayoutPicker value={layoutMode} onChange={setLayoutMode} disabled={busy} />
      {file ? (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            {analyzeBusy
              ? "Analyzing PDF…"
              : recommendedEngine === "classic"
                ? "Classic translate (free open-source MT)"
                : "AI translate (scanned / complex PDF)"}
          </span>
          {engineReason && !analyzeBusy ? ` — ${engineReason}` : null}
        </p>
      ) : null}
    </div>
  );

  const targetLabel = langLabel(targetLang);

  const handleDesktopDownload = useCallback(async () => {
    if (!resultBlob) return;
    await safeDownloadBlob(resultBlob, `translated_${targetLang}.pdf`);
  }, [resultBlob, targetLang]);

  const desktopExperience = (
    <AiToolDesktopAdapter
      toolSlug="translate-pdf"
      stage={desktopStage}
      file={file}
      progress={cloudProgress}
      resultBlob={resultBlob}
      resultFilename={`translated_${targetLang}.pdf`}
      objectUrl={translateLifecycle.objectUrl}
      onFiles={handleFiles}
      onReset={clearFile}
      onDownload={handleDesktopDownload}
      isSignedIn={isSignedIn}
      aiTrialAvailable={aiTrialRemaining > 0 || (usage?.credits?.available ?? 0) > 0}
      showBrowser={false}
      modes={["ai_plus"]}
      primaryActionLabel={`Translate to ${targetLabel}`}
      settings={languageSettings}
      onRequestSignIn={() =>
        requestSignIn({
          reason: SIGN_IN_REASON.translate,
          tone: "cloud",
          deferredAction: "premium-restore",
          toolSlug: "translate-pdf",
        })
      }
      onChooseMode={onModeChoose}
      onDeferredCloudStart={stashCloudStart}
    />
  );

  const showMobileDeferred =
    Boolean(file) && !resultBlob && !busy && !extractedText;

  const mobileWorkflowStep: ToolWorkflowStepId = !file
    ? "upload"
    : resultBlob && translatedReady
      ? "done"
      : busy
        ? "process"
        : "configure";

  const mobileExperience = (
    <MobileToolLayout
      slug="translate-pdf"
      toolLabel="Translate PDF"
      title="Translate PDF"
      workflowStep={mobileWorkflowStep}
      settingsPanel={file && !resultBlob ? languageSettings : undefined}
      settingsSheetVariant="bottom"
      autoOpenSettings={Boolean(file && !resultBlob && !busy)}
      processButton={
        file ? (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={busy}
            onClick={() =>
              void (
                isSignedIn
                  ? runCloudTranslate()
                  : stashCloudStart(recommendedEngine === "ai" ? "ai_plus" : "classic_mt")
              )
            }
          >
            <Languages className="h-4 w-4" />
            {busy ? "Translating…" : `Translate to ${targetLabel}`}
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {!file ? (
        <ProcessingStatusOverlay active={busy} type="ai" progress={cloudProgress}>
          <DropZone
            onFiles={(f) => void handleFiles(f)}
            accept=".pdf,application/pdf"
            multiple={false}
            label="Upload PDF"
            lockSuccess
          />
        </ProcessingStatusOverlay>
      ) : (
        <>
          <ToolUploadedFileCard file={file} onRemove={clearFile} className="mb-3" />
          {!resultBlob ? (
            <p className="mb-3 text-center text-xs text-muted-foreground">{selectedFileLabel}</p>
          ) : null}
        </>
      )}
      {file && !resultBlob && !busy ? (
        <div className="mt-2 overflow-hidden rounded-2xl border border-border lg:hidden">
          <ToolInputPreview file={file} label={file.name} className="min-h-[160px]" />
        </div>
      ) : null}
      {showMobileDeferred ? (
        <div className="mt-4 space-y-3">
          <DeferredStartPanel
            variant="ai"
            title="Ready to translate"
            subtitle="Preview your PDF, pick languages, then run AI Plus on Turbo Cloud when signed in."
            onStart={() => void stashCloudStart("ai_plus")}
            loading={busy}
            isSignedIn={isSignedIn}
          />
        </div>
      ) : null}
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
      {resultBlob && translatedReady ? (
        <div className="mt-4">
          <EnhancedToolResultPanel
            blob={resultBlob}
            filename={`translated_${targetLang}.pdf`}
            toolSlug="translate-pdf"
            objectUrl={translateLifecycle.objectUrl}
            secondsLeft={translateLifecycle.secondsLeft}
            cloudExpired={translateLifecycle.cloudExpired}
            persisting={translateLifecycle.persisting}
            jobId={translateLifecycle.jobId}
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
    <ToolRouteShell
      slug="translate-pdf"
      toolName="Translate PDF"
      seoTitle="Translate PDF — PDFTrusted"
      seoDescription="Translate PDF content to 50+ languages with AI Plus on secure cloud workers."
      seoKeywords="translate PDF, Hindi English PDF, PDFTrusted AI"
    >
      <ToolPageSplit desktop={desktopExperience} mobile={mobileExperience} />
    </ToolRouteShell>
  );
}
