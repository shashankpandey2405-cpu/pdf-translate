"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import DropZone from "@/components/DropZone";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { DesktopMiniSidebar } from "@/components/desktop/DesktopMiniSidebar";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { FileText } from "lucide-react";
import { AiTierPickerModal } from "@/components/ai/summarize/AiTierPickerModal";
import { AiSummaryChatPanel } from "@/components/ai/summarize/AiSummaryChatPanel";
import {
  aiToolChatColumn,
  aiToolChatFill,
  aiToolDesktopRoot,
  aiToolDesktopRow,
  aiToolPreviewColumn,
} from "@/components/ai/aiToolLayout";
import { DeferredStartPanel } from "@/components/conversion/DeferredStartPanel";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { usePremium } from "@/context/PremiumContext";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { aiCloudJobOptions } from "@/lib/processing/aiCloudOptions";
import { langLabel } from "@/lib/ai/translateLanguages";
import type { AiSummarizeTier, SummaryLength } from "@/lib/ai/summarizeTier";
import { MobileFileUpload } from "@/components/upload/MobileFileUpload";
import { SuggestCompressModal } from "@/components/processing/SuggestCompressModal";
import { extractTextFromImage, isImageFile, isPdfFile } from "@/lib/ocr/imageOcr";
import { useFileSizeGate } from "@/hooks/useFileSizeGate";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { deriveOutputFilename } from "@/lib/files/deriveOutputFilename";
import { toast } from "sonner";
import { PLATFORM } from "@/lib/processing/documentScale";
import { maxFileMbForTier } from "@/lib/limits/fileSizePolicy";
import { cn } from "@/lib/utils";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { AiPrivacyBadge } from "@/components/ai/AiPrivacyBadge";
import { stashPremiumFlow, premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";

type SessionData = {
  summaryText: string;
  suggestedQuestions: string[];
  aiTier: AiSummarizeTier;
};

type Props = {
  outputLang: string;
  onOutputLangChange?: (code: string) => void;
  languageSettings?: React.ReactNode;
};

export function AiSummarizeWorkspace({ outputLang, languageSettings }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [tierOpen, setTierOpen] = useState(false);
  const [tier, setTier] = useState<AiSummarizeTier>("standard");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [session, setSession] = useState<SessionData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [pendingStart, setPendingStart] = useState(false);
  const processFileRef = useRef<File | null>(null);

  const premiumCloud = usePremiumCloudRun("ai-summarize", "AI Summarize PDF");
  const { isPremium, isSignedIn } = usePremium();
  const { resolveSignedIn, requireSignIn } = useAuthAction();
  const { requestSignIn } = useAuthPrompt();
  const { compressOpen, setCompressOpen, blockedFile, blockedSizeMb, gateFile } = useFileSizeGate(isPremium);
  const [, navigate] = useLocation();

  const busy = premiumCloud.status === "queued" || premiumCloud.status === "processing";

  const handleFiles = useCallback(
    async (files: File[]) => {
      const f = files[0];
      if (!f) return;
      if (!gateFile(f)) return;
      setFile(f);
      processFileRef.current = f;
      setSession(null);
      setJobId(null);
      setResultBlob(null);
      setPendingStart(false);
      premiumCloud.lifecycle.reset();

      if (isImageFile(f)) {
        setTierOpen(true);
        return;
      }

      if (!isPdfFile(f)) {
        toast.error("Unsupported file", { description: "Upload a PDF or photo (JPG/PNG)." });
        return;
      }
      setTierOpen(true);
    },
    [gateFile, premiumCloud.lifecycle],
  );

  const pollSession = useCallback(async (id: string) => {
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch(`/api/ai/session/${id}`, { credentials: "include" });
        if (res.status === 202) continue;
        if (!res.ok) continue;
        const data = (await res.json()) as {
          session?: SessionData;
        };
        if (data.session?.summaryText || data.session?.suggestedQuestions?.length) {
          setSession(data.session as SessionData);
          return;
        }
      } catch {
        continue;
      }
    }
  }, []);

  const runSummarize = useCallback(async (sourceFile?: File) => {
    const activeFile = sourceFile ?? file;
    if (!activeFile) return;
    if (!(await resolveSignedIn())) {
      await requireSignIn({
        reason: SIGN_IN_REASON.aiSummarize,
        tone: "ai",
        deferredAction: "premium-restore",
        toolSlug: "ai-summarize",
        autoStart: true,
      });
      return;
    }

    const maxMb = maxFileMbForTier(isPremium);
    if (!isImageFile(activeFile) && activeFile.size > maxMb * 1024 * 1024) {
      setCompressOpen(true);
      toast.error(`File exceeds ${maxMb} MB limit`);
      return;
    }
    if (!isImageFile(activeFile) && !isPdfFile(activeFile)) {
      toast.error("Unsupported file type");
      return;
    }

    try {
      if (isImageFile(activeFile)) {
        const toastId = toast.loading("Reading image (OCR)…");
        const ocrText = await extractTextFromImage(activeFile);
        const res = await fetch("/api/ai/image-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ocrText,
            fileName: activeFile.name,
            toolSlug: "ai-summarize",
            fileSizeBytes: activeFile.size,
            outputLang,
            aiTier: tier,
            summaryLength: length,
          }),
        });
        const data = (await res.json()) as {
          jobId?: string;
          session?: SessionData;
          message?: string;
        };
        if (!res.ok) throw new Error(data.message ?? "Summarize failed");
        if (data.jobId) setJobId(data.jobId);
        if (data.session) setSession(data.session as SessionData);
        toast.success("Summary ready", { id: toastId });
        return;
      }

      const pages = await getPDFPageCount(activeFile);
      const pageCap = isPremium ? PLATFORM.maxPagesPremium : PLATFORM.maxPagesStandard;
      if (pages > pageCap) {
        toast.error(`Too many pages (max ${pageCap})`);
        return;
      }
      const toastId = toast.loading("Reading your document with AI…");
      const { blob, cloud } = await premiumCloud.runPremium(activeFile, pages, {
        ...aiCloudJobOptions({
          toolSlug: "ai-summarize",
          processingMode: "ai_plus",
          jobType: "summarize",
          outputLang: langLabel(outputLang),
          aiTier: tier,
          summaryLength: length,
        }),
      });
      setResultBlob(blob);
      setJobId(cloud.jobId ?? null);
      if (cloud.jobId) void pollSession(cloud.jobId);
      toast.success("Summary ready", { id: toastId });
    } catch (e) {
      toast.error("Summarize failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  }, [file, length, outputLang, pollSession, premiumCloud, requireSignIn, resolveSignedIn, tier, isPremium, setCompressOpen]);

  const startSummarizeFlow = useCallback(async () => {
    const f = processFileRef.current ?? file;
    if (!f) return;
    if (!(await resolveSignedIn())) {
      await stashPremiumFlow({
        blob: f,
        fileName: f.name,
        mimeType: f.type || "application/pdf",
        toolSlug: "ai-summarize",
        mode: "enhanced",
        settings: { tier, length, outputLang },
      });
      requestSignIn({
        reason: SIGN_IN_REASON.aiSummarize,
        tone: "ai",
        deferredAction: "premium-restore",
        toolSlug: "ai-summarize",
        autoStart: true,
      });
      return;
    }
    await runSummarize(f);
  }, [file, length, outputLang, requestSignIn, resolveSignedIn, runSummarize, tier]);

  usePremiumFlowRestore(
    "ai-summarize",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      processFileRef.current = restored;
      setFile(restored);
      setSession(null);
      setJobId(null);
      setResultBlob(null);
      setPendingStart(true);
      const settings = flow.settings as { tier?: AiSummarizeTier; length?: SummaryLength; outputLang?: string } | undefined;
      if (settings?.tier) setTier(settings.tier);
      if (settings?.length) setLength(settings.length);
    },
    {
      onAutoStart: async () => {
        const f = processFileRef.current;
        if (f) await runSummarize(f);
      },
    },
  );

  const onContinueTier = () => {
    setTierOpen(false);
    setPendingStart(true);
  };

  const onGoPricing = () => {
    setTierOpen(false);
    navigate("/pricing");
  };

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    const name = deriveOutputFilename(file.name, "summarized", "pdf");
    void safeDownloadBlob(resultBlob, name);
  }, [resultBlob, file]);

  useEffect(() => {
    if (busy) setSession(null);
  }, [busy]);

  const resetFile = () => {
    setFile(null);
    processFileRef.current = null;
    setSession(null);
    setJobId(null);
    setPendingStart(false);
    premiumCloud.lifecycle.reset();
  };

  const deferredPanel =
    file && pendingStart && !session && !busy && !resultBlob ? (
      <DeferredStartPanel
        variant="ai"
        onStart={() => void startSummarizeFlow()}
        loading={busy}
        isSignedIn={isSignedIn}
        className="mt-3"
      />
    ) : null;

  const mobilePanel = (
      <MobileToolLayout
        slug="ai-summarize"
        toolLabel="AI Summarize"
        title="AI PDF Summarizer"
        settingsPanel={languageSettings ?? undefined}
      >
        {!file ? (
          <>
            <AiPrivacyBadge className="mb-3" />
            <MobileFileUpload
              onFiles={(f) => void handleFiles(f)}
              acceptPdf
              acceptImages
              isPremium={isPremium}
              disabled={busy}
            />
          </>
        ) : (
          <div className="space-y-3">
            <ToolUploadedFileCard file={file} onRemove={resetFile} />
            {deferredPanel}
          </div>
        )}
        <div className={cn("mt-3 flex-1", !file && "opacity-60")}>
          <AiSummaryChatPanel
            summaryText={session?.summaryText ?? ""}
            suggestedQuestions={session?.suggestedQuestions ?? []}
            aiTier={session?.aiTier ?? tier}
            jobId={jobId}
            busy={busy}
            onDownload={resultBlob ? handleDownload : undefined}
            downloadDisabled={!premiumCloud.lifecycle.objectUrl}
          />
        </div>
      </MobileToolLayout>
  );

  const desktopPanel = (
      <div className={aiToolDesktopRoot}>
        <DesktopMiniSidebar activeSlug="ai-summarize" />
        <div className={aiToolDesktopRow}>
          <section className={cn(aiToolPreviewColumn, "p-4")}>
            <h1 className="mb-4 shrink-0 text-xl font-bold">AI PDF Summarizer</h1>
            <AiPrivacyBadge className="mb-4 shrink-0" />
            {languageSettings ? <div className="mb-4 shrink-0">{languageSettings}</div> : null}
            {!file ? (
              <DropZone
                onFiles={(f) => void handleFiles(f)}
                accept="application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.webp"
                multiple={false}
                label="Upload PDF or photo"
                lockSuccess
              />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <ToolInputPreview
                  file={file}
                  label={file.name}
                  previewLayout="paged"
                  fullPage
                  className="flex min-h-0 flex-1 flex-col"
                />
                {deferredPanel}
                <button type="button" className="shrink-0 text-sm text-muted-foreground underline" onClick={resetFile}>
                  Remove file
                </button>
              </div>
            )}
          </section>
          <section className={cn(aiToolChatColumn, !file && "opacity-80")}>
            <div className={aiToolChatFill}>
              <AiSummaryChatPanel
                summaryText={session?.summaryText ?? ""}
                suggestedQuestions={session?.suggestedQuestions ?? []}
                aiTier={session?.aiTier ?? tier}
                jobId={jobId}
                busy={busy}
                onDownload={resultBlob ? handleDownload : undefined}
                downloadDisabled={!premiumCloud.lifecycle.objectUrl}
              />
            </div>
          </section>
        </div>
      </div>
  );

  return (
    <>
      <ToolPageSplit desktop={desktopPanel} mobile={mobilePanel} />
      <AiTierPickerModal
        open={tierOpen}
        onOpenChange={setTierOpen}
        tier={tier}
        onTierChange={setTier}
        length={length}
        onLengthChange={setLength}
        isPremium={isPremium}
        onContinue={onContinueTier}
        onGoPricing={onGoPricing}
      />
      <SuggestCompressModal
        open={compressOpen}
        onOpenChange={setCompressOpen}
        fileName={blockedFile?.name}
        sizeMb={blockedSizeMb}
      />
    </>
  );
}
