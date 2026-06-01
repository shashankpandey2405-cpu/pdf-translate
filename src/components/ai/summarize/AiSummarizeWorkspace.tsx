"use client";

import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";
import DropZone from "@/components/DropZone";
import { MobileFileUpload } from "@/components/upload/MobileFileUpload";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { AiTierPickerModal } from "@/components/ai/summarize/AiTierPickerModal";
import { AiSummaryResultView } from "@/components/ai/summarize/AiSummaryResultView";
import { AiCompactFileStep } from "@/components/ai/workflow/AiCompactFileStep";
import { AiProcessingFocus } from "@/components/ai/workflow/AiProcessingFocus";
import { AiFocusShell } from "@/components/ai/workflow/AiFocusShell";
import { SuggestCompressModal } from "@/components/processing/SuggestCompressModal";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { usePremium } from "@/context/PremiumContext";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { aiCloudJobOptions } from "@/lib/processing/aiCloudOptions";
import { langLabel } from "@/lib/ai/translateLanguages";
import type { AiSummarizeTier, SummaryLength } from "@/lib/ai/summarizeTier";
import { extractTextFromImage, isImageFile, isPdfFile } from "@/lib/ocr/imageOcr";
import { useFileSizeGate } from "@/hooks/useFileSizeGate";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { deriveOutputFilename } from "@/lib/files/deriveOutputFilename";
import { toast } from "sonner";
import { PLATFORM } from "@/lib/processing/documentScale";
import { maxFileMbForTier } from "@/lib/limits/fileSizePolicy";
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
  onOutputLangChange: (code: string) => void;
};

export function AiSummarizeWorkspace({ outputLang, onOutputLangChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tier, setTier] = useState<AiSummarizeTier>("standard");
  const [length, setLength] = useState<SummaryLength>("medium");
  const [session, setSession] = useState<SessionData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const processFileRef = useRef<File | null>(null);

  const premiumCloud = usePremiumCloudRun("ai-summarize", "AI Summarize PDF");
  const { isPremium, isSignedIn } = usePremium();
  const { resolveSignedIn, requireSignIn } = useAuthAction();
  const { requestSignIn } = useAuthPrompt();
  const { compressOpen, setCompressOpen, blockedFile, blockedSizeMb, gateFile } = useFileSizeGate(isPremium);
  const [, navigate] = useLocation();

  const busy = premiumCloud.status === "queued" || premiumCloud.status === "processing";
  const hasResult = Boolean(session?.summaryText);

  const pollSession = useCallback(async (id: string) => {
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const res = await fetch(`/api/ai/session/${id}`, { credentials: "include" });
        if (res.status === 202) continue;
        if (!res.ok) continue;
        const data = (await res.json()) as { session?: SessionData };
        if (data.session?.summaryText) {
          setSession(data.session as SessionData);
          return;
        }
      } catch {
        continue;
      }
    }
  }, []);

  const runSummarize = useCallback(
    async (sourceFile?: File) => {
      const activeFile = sourceFile ?? file;
      if (!activeFile) return;
      setSettingsOpen(false);

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

      setSession(null);

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
          const data = (await res.json()) as { jobId?: string; session?: SessionData; message?: string };
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
        const toastId = toast.loading("Processing with AI…");
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
    },
    [
      file,
      length,
      outputLang,
      pollSession,
      premiumCloud,
      requireSignIn,
      resolveSignedIn,
      tier,
      isPremium,
      setCompressOpen,
    ],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f || !gateFile(f)) return;
      if (!isImageFile(f) && !isPdfFile(f)) {
        toast.error("Upload a PDF or photo (JPG/PNG).");
        return;
      }
      setFile(f);
      processFileRef.current = f;
      setSession(null);
      setJobId(null);
      setResultBlob(null);
      setSettingsOpen(false);
      premiumCloud.lifecycle.reset();
    },
    [gateFile, premiumCloud.lifecycle],
  );

  const resetAll = useCallback(() => {
    setFile(null);
    processFileRef.current = null;
    setSession(null);
    setJobId(null);
    setResultBlob(null);
    setSettingsOpen(false);
    premiumCloud.lifecycle.reset();
  }, [premiumCloud.lifecycle]);

  const handleDownload = useCallback(() => {
    if (!resultBlob || !file) return;
    void safeDownloadBlob(resultBlob, deriveOutputFilename(file.name, "summarized", "pdf"));
  }, [resultBlob, file]);

  usePremiumFlowRestore(
    "ai-summarize",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      processFileRef.current = restored;
      setFile(restored);
      setSession(null);
      setJobId(null);
      setResultBlob(null);
      const settings = flow.settings as { tier?: AiSummarizeTier; length?: SummaryLength; outputLang?: string } | undefined;
      if (settings?.tier) setTier(settings.tier);
      if (settings?.length) setLength(settings.length);
      if (settings?.outputLang) onOutputLangChange(settings.outputLang);
      setSettingsOpen(true);
    },
    {
      onAutoStart: async () => {
        const f = processFileRef.current;
        if (f) await runSummarize(f);
      },
    },
  );

  const openSettings = useCallback(async () => {
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
    setSettingsOpen(true);
  }, [file, length, onOutputLangChange, outputLang, requestSignIn, resolveSignedIn, tier]);

  const progress = premiumCloud.status === "queued" ? 25 : Math.min(95, 35 + (premiumCloud.progress ?? 0) * 0.6);

  const mainContent = (() => {
    if (busy) {
      return (
        <AiProcessingFocus
          title="PDF Intelligence Engine"
          progress={progress}
          steps={["Analyzing document…", "Extracting content…", "Generating summary…"]}
        />
      );
    }
    if (hasResult && file && session) {
      return (
        <AiSummaryResultView
          fileName={file.name}
          outputLang={outputLang}
          length={length}
          tier={session.aiTier ?? tier}
          summaryText={session.summaryText}
          suggestedQuestions={session.suggestedQuestions ?? []}
          jobId={jobId}
          aiTier={session.aiTier ?? tier}
          onDownload={resultBlob ? handleDownload : undefined}
          onRegenerate={() => void runSummarize()}
        />
      );
    }
    if (file) {
      return (
        <AiFocusShell>
          <AiCompactFileStep file={file} onContinue={() => void openSettings()} onRemove={resetAll} />
        </AiFocusShell>
      );
    }
    return (
      <AiFocusShell>
        <div className="space-y-4">
          <AiPrivacyBadge />
          <h1 className="text-center text-xl font-bold sm:text-2xl">AI PDF Summarizer</h1>
          <p className="text-center text-sm text-muted-foreground">
            Upload a PDF — configure settings in one step, then we summarize.
          </p>
          <DropZone
            onFiles={(f) => void handleFiles(f)}
            accept="application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.webp"
            multiple={false}
            label="Upload PDF or photo"
            lockSuccess
          />
        </div>
      </AiFocusShell>
    );
  })();

  const mobileContent = (
    <MobileToolLayout slug="ai-summarize" toolLabel="AI Summarize" title="AI PDF Summarizer">
      {!file && !busy && !hasResult ? (
        <div className="p-4">
          <AiPrivacyBadge className="mb-3" />
          <MobileFileUpload
            onFiles={(f) => void handleFiles(f)}
            acceptPdf
            acceptImages
            isPremium={isPremium}
            disabled={busy}
          />
        </div>
      ) : (
        mainContent
      )}
    </MobileToolLayout>
  );

  return (
    <>
      <ToolPageSplit
        desktop={<div className="flex min-h-[calc(100vh-4rem)] flex-col">{mainContent}</div>}
        mobile={mobileContent}
      />
      <AiTierPickerModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        tier={tier}
        onTierChange={setTier}
        length={length}
        onLengthChange={setLength}
        outputLang={outputLang}
        onOutputLangChange={onOutputLangChange}
        isPremium={isPremium}
        onStart={() => void runSummarize()}
        onGoPricing={() => {
          setSettingsOpen(false);
          navigate("/pricing");
        }}
        starting={busy}
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
