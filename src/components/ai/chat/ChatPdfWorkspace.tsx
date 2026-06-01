"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import DropZone from "@/components/DropZone";
import { MobileFileUpload } from "@/components/upload/MobileFileUpload";
import { SuggestCompressModal } from "@/components/processing/SuggestCompressModal";
import { AiTranslateToggle } from "@/components/ai/AiTranslateToggle";
import { extractTextFromImage, isImageFile, isPdfFile } from "@/lib/ocr/imageOcr";
import { useFileSizeGate } from "@/hooks/useFileSizeGate";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AiProcessingSteps } from "@/components/mobile/AiProcessingSteps";
import { AIChatInterface } from "@/components/ai/AIChatInterface";
import { ChatDocumentBriefPanel } from "@/components/ai/chat/ChatDocumentBriefPanel";
import {
  aiToolChatColumn,
  aiToolChatFill,
  aiToolChatPanelClass,
  aiToolDesktopRoot,
  aiToolDesktopRow,
  aiToolPreviewColumnNarrow,
} from "@/components/ai/aiToolLayout";
import { AiPrivacyBadge } from "@/components/ai/AiPrivacyBadge";
import { DeferredStartPanel } from "@/components/conversion/DeferredStartPanel";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { ProcessingStatusOverlay } from "@/components/processing/ProcessingStatusOverlay";
import { DesktopMiniSidebar } from "@/components/desktop/DesktopMiniSidebar";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { MobileAiPreviewModal } from "@/components/mobile/MobileAiPreviewModal";
import { useEnhancedJob } from "@/hooks/useEnhancedJob";
import { usePremium } from "@/context/PremiumContext";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useAuthPrompt, stashAuthIntent } from "@/context/AuthPromptContext";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import {
  MessageSquare,
  Send,
  FileText,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { Button } from "@/components/ui/button";
import { stashPremiumFlow, premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";

type ChatTurn = { role: "user" | "assistant"; content: string };
type SessionData = {
  suggestedQuestions: string[];
  documentExcerpt: string;
  summaryText?: string;
  documentHighlights?: string[];
  suggestedActions?: string[];
  readMethod?: "text" | "vision_enhanced";
};

export function ChatPdfWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const processFileRef = useRef<File | null>(null);

  const enhancedJob = useEnhancedJob("chat-pdf");
  const { isPremium, isSignedIn } = usePremium();
  const { resolveSignedIn } = useAuthAction();
  const { requestSignIn } = useAuthPrompt();
  const { compressOpen, setCompressOpen, blockedFile, blockedSizeMb, gateFile } = useFileSizeGate(isPremium);

  const busy = enhancedJob.status === "queued" || enhancedJob.status === "processing" || preparing;

  const pollSession = useCallback(async (id: string) => {
    for (let i = 0; i < 60; i += 1) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const res = await fetch(`/api/ai/session/${id}`, { credentials: "include" });
        if (res.status === 202) continue;
        if (!res.ok) continue;
        const data = (await res.json()) as { session?: SessionData };
        if (
          data.session?.documentExcerpt ||
          data.session?.suggestedQuestions?.length ||
          data.session?.summaryText
        ) {
          setSession({
            documentExcerpt: data.session.documentExcerpt ?? "",
            suggestedQuestions: data.session.suggestedQuestions ?? [],
            summaryText: data.session.summaryText,
            documentHighlights: data.session.documentHighlights ?? [],
            suggestedActions: data.session.suggestedActions ?? [],
            readMethod: data.session.readMethod,
          });
          return;
        }
      } catch {
        continue;
      }
    }
  }, []);

  const runChatProcessingWithFile = useCallback(
    async (f: File) => {
      setPreparing(true);
      try {
        if (isImageFile(f)) {
          const toastId = toast.loading("Reading image text (OCR)…");
          const ocrText = await extractTextFromImage(f);
          const res = await fetch("/api/ai/image-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              ocrText,
              fileName: f.name,
              toolSlug: "chat-pdf",
              fileSizeBytes: f.size,
            }),
          });
          const data = (await res.json()) as {
            jobId?: string;
            session?: SessionData;
            message?: string;
            suggestCompress?: boolean;
          };
          if (!res.ok) {
            if (data.suggestCompress) setCompressOpen(true);
            throw new Error(data.message ?? "Could not start chat from image");
          }
          if (data.jobId) setJobId(data.jobId);
          if (data.session) setSession(data.session);
          else if (data.jobId) await pollSession(data.jobId);
          toast.success("Ready — ask your first question", { id: toastId });
          return;
        }

        const pages = await getPDFPageCount(f);
        const toastId = toast.loading("Reading your document — clarifying scan & summarizing…");
        const result = await enhancedJob.run(f, pages ?? null, {
          processingMode: "ai_plus",
          aiTier: "standard",
          toolSlug: "chat-pdf",
        });
        setJobId(result.jobId);
        await pollSession(result.jobId);
        toast.success("PDF ready for chat", { id: toastId });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to process document";
        toast.error(msg);
      } finally {
        setPreparing(false);
      }
    },
    [enhancedJob, pollSession, setCompressOpen],
  );

  const startChatSession = useCallback(async () => {
    const f = file ?? processFileRef.current;
    if (!f) return;

    if (!(await resolveSignedIn())) {
      const stashed = await stashPremiumFlow({
        blob: f,
        fileName: f.name,
        mimeType: f.type,
        toolSlug: "chat-pdf",
        mode: "enhanced",
      });
      if (!stashed) {
        toast.error("Could not save file for sign-in. Try a smaller file.");
        return;
      }
      const returnPath =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      stashAuthIntent({
        returnPath,
        desiredMode: "enhanced",
        toolSlug: "chat-pdf",
        autoStart: true,
        deferredAction: "premium-restore",
        reason: isImageFile(f) ? SIGN_IN_REASON.aiChatImage : SIGN_IN_REASON.aiChat,
        tone: "ai",
      });
      requestSignIn({
        reason: isImageFile(f) ? SIGN_IN_REASON.aiChatImage : SIGN_IN_REASON.aiChat,
        tone: "ai",
        deferredAction: "premium-restore",
        toolSlug: "chat-pdf",
        autoStart: true,
      });
      return;
    }

    await runChatProcessingWithFile(f);
  }, [file, resolveSignedIn, requestSignIn, runChatProcessingWithFile]);

  usePremiumFlowRestore(
    "chat-pdf",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      processFileRef.current = restored;
      setFile(restored);
      setSession(null);
      setJobId(null);
      setMessages([]);
    },
    {
      onAutoStart: async () => {
        const f = processFileRef.current;
        if (f) await runChatProcessingWithFile(f);
      },
    },
  );

  const acceptUpload = useCallback(
    (f: File) => {
      if (!gateFile(f)) return;
      setFile(f);
      processFileRef.current = f;
      setSession(null);
      setJobId(null);
      setMessages([]);
      setPreparing(false);
    },
    [gateFile],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      if (isImageFile(f)) {
        acceptUpload(f);
        return;
      }
      if (!isPdfFile(f)) {
        toast.error("Unsupported file", { description: "Upload a PDF or a photo (JPG/PNG)." });
        return;
      }
      acceptUpload(f);
    },
    [acceptUpload],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !jobId || chatBusy) return;

      setChatBusy(true);
      const prior = [...messages];
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            jobId,
            message: trimmed,
            messages: prior,
            aiTier: "standard",
          }),
        });
        const data = (await res.json()) as {
          reply?: string;
          message?: string;
        };
        if (!res.ok) throw new Error(data.message ?? "Chat failed");
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "" }]);
      } catch (e) {
        toast.error("Could not send message", {
          description: e instanceof Error ? e.message : "Try again.",
        });
        setMessages(prior);
      } finally {
        setChatBusy(false);
      }
    },
    [jobId, chatBusy, messages],
  );

  const copyMessage = (idx: number, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const startOver = () => {
    setFile(null);
    processFileRef.current = null;
    setSession(null);
    setJobId(null);
    setMessages([]);
    setPreparing(false);
  };

  const chatReady = Boolean(session && jobId);
  const awaitingStart = Boolean(file && !chatReady && !busy);

  const pendingStartPanel = (
    <DeferredStartPanel
      variant="ai"
      guestCta="Continue with Google — Start chat"
      signedInCta="Start chat with this PDF"
      onStart={() => void startChatSession()}
      loading={preparing}
      disabled={busy}
      isSignedIn={isSignedIn}
      className="w-full max-w-md"
    />
  );

  const chatMessages = (
    <>
      {messages.length === 0 ? (
        <div className="space-y-4">
          {session ? (
            <ChatDocumentBriefPanel
              brief={{
                summaryText: session.summaryText ?? "",
                documentHighlights: session.documentHighlights ?? [],
                suggestedActions: session.suggestedActions ?? [],
                readMethod: session.readMethod,
              }}
            />
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Your PDF is ready</h3>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ask anything about this document. I&apos;ll answer using only what&apos;s in your file.
              </p>
            </div>
          )}
          {session?.suggestedQuestions?.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Try asking — based on what I read
              </p>
              {session.suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {q}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={cn(
                "group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto border border-border bg-card",
              )}
            >
              {m.role === "assistant" && (
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    PDFTrusted AI
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.role === "assistant" ? (
                <AiTranslateToggle text={m.content} className="mt-3 border-t border-border/60 pt-3" />
              ) : null}
              {m.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => copyMessage(i, m.content)}
                  className="absolute right-2 top-2 rounded-lg p-1.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                >
                  {copiedIdx === i ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          ))}
          {chatBusy ? (
            <div className="mr-auto rounded-2xl border border-slate-200/50 bg-white/40 px-4 py-3 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/40">
              <ProcessingStatus type="ai" label="Thinking…" className="py-2" />
            </div>
          ) : null}
          <div ref={chatEndRef} />
        </div>
      )}
    </>
  );

  const chatInputFooter = (
    <div className="relative flex items-center">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void sendMessage(input)}
        placeholder="Ask anything about the document…"
        disabled={chatBusy}
        className="w-full rounded-2xl border border-border/60 bg-background px-5 py-3 pr-12 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
      />
      <Button
        type="button"
        size="icon"
        disabled={chatBusy || !input.trim()}
        onClick={() => void sendMessage(input)}
        className="shimmer-btn absolute right-2 h-9 w-9 rounded-xl bg-primary text-white shadow-md hover:scale-105"
      >
        {chatBusy ? (
          <span className="neural-wave inline-flex h-4 items-end gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="neural-wave-bar h-3 w-0.5 rounded-full bg-white/90"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </span>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  const chatPanel = (
    <AIChatInterface
      title="Chat with PDF"
      statusOnline={!chatBusy}
      statusLabel={chatBusy ? "Processing…" : "Neural AI Online"}
      footer={chatInputFooter}
      showPrivacyBadge={false}
      className={aiToolChatPanelClass}
    >
      {chatMessages}
    </AIChatInterface>
  );

  const mobilePanel = (
      <div className="flex h-[calc(100dvh-3rem-3rem-env(safe-area-inset-top))] flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="flex min-w-0 flex-1 flex-col">
          {!file ? (
            <div className="flex flex-1 flex-col p-4">
              <AiPrivacyBadge className="mb-3" />
              <h1 className="mb-1 text-lg font-bold">Chat with PDF</h1>
              <p className="mb-3 text-xs text-muted-foreground">
                Upload first — sign in only when you start chat.
              </p>
              <ProcessingStatusOverlay active={busy} type="ai" progress={enhancedJob.progress ?? 0}>
                <MobileFileUpload
                  onFiles={handleFiles}
                  acceptPdf
                  acceptImages
                  isPremium={isPremium}
                  disabled={busy}
                  className="flex-1"
                />
              </ProcessingStatusOverlay>
            </div>
          ) : awaitingStart ? (
            <div className="flex flex-1 flex-col gap-4 p-4">
              <ToolInputPreview file={file} toolSlug="chat-pdf" />
              <MobileAiPreviewModal preview={{ kind: "file", file }} />
              {pendingStartPanel}
              <button
                type="button"
                onClick={startOver}
                className="text-center text-xs text-muted-foreground underline"
              >
                Choose a different file
              </button>
            </div>
          ) : busy ? (
            <div className="flex flex-1 flex-col items-center justify-center p-4">
              <AiProcessingSteps progress={enhancedJob.progress ?? 50} label="Analyzing document…" />
            </div>
          ) : chatReady ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              {file ? <MobileAiPreviewModal preview={{ kind: "file", file }} className="shrink-0" /> : null}
              <div className="min-h-0 flex-1">{chatPanel}</div>
            </div>
          ) : null}
        </div>
      </div>
  );

  const desktopPanel = (
      <div className={aiToolDesktopRoot}>
        <DesktopMiniSidebar />
        <div className={aiToolDesktopRow}>
          <div className={aiToolPreviewColumnNarrow}>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <AiPrivacyBadge className="mb-3 shrink-0" />
              <div className="mb-3 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h1 className="text-lg font-bold">Chat with PDF</h1>
                </div>
                {file ? (
                  <Button variant="ghost" size="sm" onClick={startOver} className="h-8 gap-1 text-xs">
                    <RotateCcw className="h-3.5 w-3.5" />
                    New PDF
                  </Button>
                ) : null}
              </div>
              {!file ? (
                <ProcessingStatusOverlay active={busy} type="ai" progress={enhancedJob.progress ?? 0}>
                  <DropZone
                    accept="application/pdf,.pdf,image/*,.jpg,.jpeg,.png,.webp"
                    multiple={false}
                    onFiles={handleFiles}
                    className="min-h-[200px]"
                    label="Drop PDF or photo"
                    sublabel="No signup to upload — start chat when ready"
                  />
                </ProcessingStatusOverlay>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <ToolInputPreview
                    file={file}
                    previewLayout="paged"
                    fullPage
                    className="flex min-h-0 flex-1 flex-col"
                  />
                  {awaitingStart ? <div className="shrink-0">{pendingStartPanel}</div> : null}
                  {busy ? (
                    <AiProcessingSteps progress={enhancedJob.progress ?? 50} label="Analyzing PDF…" className="shrink-0 py-4" />
                  ) : null}
                  {chatReady ? (
                    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-green-500/20 bg-green-50 px-3 py-2.5 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      Chat is live — ask anything!
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div className={aiToolChatColumn}>
            {!file ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="max-w-sm text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Chat with any PDF</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload a PDF or photo, preview it, then start chat — Google sign-in only when you continue.
                  </p>
                </div>
              </div>
            ) : awaitingStart ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="max-w-md text-center">
                  <ToolInputPreview file={file} className="mx-auto mb-4 max-w-xs" />
                  <p className="text-sm text-muted-foreground">
                    Your file is loaded locally. Tap &quot;Start chat&quot; when you&apos;re ready — we&apos;ll only ask
                    for Google sign-in at that step.
                  </p>
                </div>
              </div>
            ) : busy ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <AiProcessingSteps progress={enhancedJob.progress ?? 50} label="Extracting text from your document…" />
              </div>
            ) : chatReady ? (
              <div className={aiToolChatFill}>{chatPanel}</div>
            ) : null}
          </div>
        </div>
      </div>
  );

  return (
    <>
      <ToolPageSplit
        desktop={desktopPanel}
        mobile={
          <MobileToolLayout slug="chat-pdf" toolLabel="Chat with PDF" title="Chat with PDF">
            {mobilePanel}
          </MobileToolLayout>
        }
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
