"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { DesktopMiniSidebar } from "@/components/desktop/DesktopMiniSidebar";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AiProcessingSteps } from "@/components/mobile/AiProcessingSteps";
import { DeferredStartPanel } from "@/components/conversion/DeferredStartPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePremiumCloudRun } from "@/hooks/usePremiumCloudRun";
import { usePremium } from "@/context/PremiumContext";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { useAuthAction } from "@/hooks/useAuthAction";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { usePremiumFlowRestore } from "@/hooks/usePremiumFlowRestore";
import { stashPremiumFlow, premiumFlowToFile } from "@/lib/auth/premiumFlowRestore";
import { getPDFPageCount } from "@/components/PDFThumbnail";
import { aiCloudJobOptions } from "@/lib/processing/aiCloudOptions";
import { toast } from "@/hooks/use-toast";
import { PLATFORM } from "@/lib/processing/documentScale";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  RotateCcw,
  Copy,
  Download,
  CheckCircle2,
  FileText,
  HelpCircle,
  Settings2,
} from "lucide-react";

type QuestionType = "mcq" | "true-false" | "short-answer" | "fill-blank";
type Difficulty = "easy" | "medium" | "hard";

type GeneratedQuestion = {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
};

type SessionData = {
  questions: GeneratedQuestion[];
  suggestedQuestions?: string[];
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice",
  "true-false": "True / False",
  "short-answer": "Short Answer",
  "fill-blank": "Fill in the Blank",
};

const COUNT_OPTIONS = [5, 10, 15, 20];

export default function AiQuestionGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["mcq"]);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [session, setSession] = useState<SessionData | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const processFileRef = useRef<File | null>(null);

  const premiumCloud = usePremiumCloudRun("ai-question-gen", "AI Question Generator");
  const { isSignedIn } = usePremium();
  const { resolveSignedIn, requireSignIn } = useAuthAction();
  const { requestSignIn } = useAuthPrompt();

  const busy = premiumCloud.status === "queued" || premiumCloud.status === "processing";

  const toggleType = useCallback((t: QuestionType) => {
    setQuestionTypes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t],
    );
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      processFileRef.current = f;
      setFile(f);
      setSession(null);
      setJobId(null);
      setPendingStart(true);
      premiumCloud.lifecycle.reset();
    },
    [premiumCloud.lifecycle],
  );

  const pollSession = useCallback(async (id: string) => {
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const res = await fetch(`/api/ai/session/${id}`, { credentials: "include" });
        if (res.status === 202) continue;
        if (!res.ok) continue;
        const data = await res.json() as { session?: { summaryText?: string; questions?: GeneratedQuestion[] } };
        if (data.session?.questions?.length) {
          setSession({ questions: data.session.questions });
          return;
        }
        if (data.session?.summaryText) {
          try {
            const parsed = JSON.parse(data.session.summaryText);
            if (Array.isArray(parsed?.questions)) {
              setSession({ questions: parsed.questions });
              return;
            }
          } catch {
            // Not JSON, keep polling
          }
        }
      } catch {
        continue;
      }
    }
    toast({ title: "Timeout", description: "Question generation took too long.", variant: "destructive" });
  }, []);

  const runGenerate = useCallback(async (sourceFile?: File) => {
    const activeFile = sourceFile ?? file;
    if (!activeFile) return;
    if (!(await resolveSignedIn())) {
      await requireSignIn({
        reason: SIGN_IN_REASON.questionGen,
        tone: "ai",
        deferredAction: "premium-restore",
        toolSlug: "ai-question-gen",
        autoStart: true,
      });
      return;
    }
    if (activeFile.size > PLATFORM.maxFileBytesStandard) {
      toast({ title: "File too large", description: "Use a PDF under 15 MB.", variant: "destructive" });
      return;
    }
    const pages = await getPDFPageCount(activeFile);
    if (pages > 5) {
      toast({ title: "Too many pages", description: "Max 5 pages for AI question generation.", variant: "destructive" });
      return;
    }

    try {
      const { cloud } = await premiumCloud.runPremium(activeFile, pages, {
        ...aiCloudJobOptions({
          toolSlug: "ai-question-gen",
          processingMode: "ai_plus",
          jobType: "summarize",
          outputLang: "English",
        }),
        questionTypes: questionTypes.join(","),
        questionCount: count,
        questionDifficulty: difficulty,
      });
      setJobId(cloud.jobId ?? null);
      if (cloud.jobId) void pollSession(cloud.jobId);
    } catch (e) {
      toast({
        title: "Generation failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  }, [count, difficulty, file, pollSession, premiumCloud, questionTypes, requireSignIn, resolveSignedIn]);

  const startGenerateFlow = useCallback(async () => {
    const f = processFileRef.current ?? file;
    if (!f) return;
    if (!(await resolveSignedIn())) {
      await stashPremiumFlow({
        blob: f,
        fileName: f.name,
        mimeType: f.type || "application/pdf",
        toolSlug: "ai-question-gen",
        mode: "enhanced",
        settings: { questionTypes, count, difficulty },
      });
      requestSignIn({
        reason: SIGN_IN_REASON.questionGen,
        tone: "ai",
        deferredAction: "premium-restore",
        toolSlug: "ai-question-gen",
        autoStart: true,
      });
      return;
    }
    await runGenerate(f);
  }, [count, difficulty, file, questionTypes, requestSignIn, resolveSignedIn, runGenerate]);

  usePremiumFlowRestore(
    "ai-question-gen",
    async (flow) => {
      const restored = premiumFlowToFile(flow);
      processFileRef.current = restored;
      setFile(restored);
      setSession(null);
      setJobId(null);
      setPendingStart(true);
      const settings = flow.settings as {
        questionTypes?: QuestionType[];
        count?: number;
        difficulty?: Difficulty;
      } | undefined;
      if (settings?.questionTypes?.length) setQuestionTypes(settings.questionTypes);
      if (settings?.count) setCount(settings.count);
      if (settings?.difficulty) setDifficulty(settings.difficulty);
    },
    {
      onAutoStart: async () => {
        const f = processFileRef.current;
        if (f) await runGenerate(f);
      },
    },
  );

  const copyAll = useCallback(() => {
    if (!session?.questions) return;
    const text = session.questions
      .map((q, i) => {
        let s = `Q${i + 1}. ${q.question}`;
        if (q.options?.length) s += "\n" + q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}) ${o}`).join("\n");
        s += `\nAnswer: ${q.answer}`;
        if (q.explanation) s += `\nExplanation: ${q.explanation}`;
        return s;
      })
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  }, [session]);

  const downloadTxt = useCallback(async () => {
    if (!session?.questions) return;
    const text = session.questions
      .map((q, i) => {
        let s = `Q${i + 1}. [${q.type}] ${q.question}`;
        if (q.options?.length) s += "\n" + q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}) ${o}`).join("\n");
        s += `\nAnswer: ${q.answer}`;
        if (q.explanation) s += `\nExplanation: ${q.explanation}`;
        return s;
      })
      .join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const name = `questions_${file?.name?.replace(/\.pdf$/i, "") ?? "quiz"}.txt`;
    await safeDownloadBlob(blob, name);
  }, [file, session]);

  const reset = useCallback(() => {
    setFile(null);
    processFileRef.current = null;
    setSession(null);
    setJobId(null);
    setPendingStart(false);
    premiumCloud.lifecycle.reset();
  }, [premiumCloud.lifecycle]);

  useEffect(() => {
    if (busy) setSession(null);
  }, [busy]);

  const settingsPanel = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Question Types</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleType(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                questionTypes.includes(key)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Count</Label>
          <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Difficulty</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const questionResultsList = session?.questions && !busy ? (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">{session.questions.length} Questions Generated</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy All"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void downloadTxt()} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {session.questions.map((q, i) => (
          <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {q.type}
                </span>
                <p className="mt-1 text-sm font-medium">{q.question}</p>
              </div>
            </div>
            {q.options?.length ? (
              <div className="ml-8 space-y-1">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={cn(
                      "rounded px-2 py-1 text-sm",
                      opt === q.answer && "bg-green-50 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300",
                    )}
                  >
                    {String.fromCharCode(65 + j)}) {opt}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="ml-8 rounded bg-blue-50 px-3 py-1.5 text-sm dark:bg-blue-900/20">
              <span className="font-medium text-blue-700 dark:text-blue-300">Answer:</span>{" "}
              <span className="text-blue-900 dark:text-blue-200">{q.answer}</span>
            </div>
            {q.explanation && (
              <p className="ml-8 text-xs text-muted-foreground italic">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const workflowStep: ToolWorkflowStepId = !file ? "upload" : session || busy ? "process" : "configure";

  const mobileProcessButton =
    file && !session && !busy ? (
      <button type="button" onClick={() => void startGenerateFlow()} className={TOOL_PRIMARY_BTN}>
        <GraduationCap className="h-5 w-5" />
        {isSignedIn ? "Generate Questions" : "Continue with Google — Generate"}
      </button>
    ) : null;

  const deferredPanel =
    file && pendingStart && !session && !busy ? (
      <DeferredStartPanel
        variant="ai"
        onStart={() => void startGenerateFlow()}
        loading={busy}
        isSignedIn={isSignedIn}
        className="mt-3"
      />
    ) : null;

  const mobilePage = (
    <MobileToolLayout
      slug="ai-question-gen"
      toolLabel="AI Question Generator"
      title="AI Question Generator"
      workflowStep={workflowStep}
      settingsPanel={file && !session ? settingsPanel : undefined}
      autoOpenSettings={Boolean(file && !session && !busy)}
      processButton={mobileProcessButton}
      postProcessPanel={
        session?.questions?.length ? (
          <MobilePostProcessPanel
            currentSlug="ai-question-gen"
            onDownload={() => void downloadTxt()}
            onProcessAnother={reset}
            downloadLabel="Download questions (.txt)"
          />
        ) : undefined
      }
    >
      {!file ? (
        <ToolUploadSlot
          files={[]}
          onFiles={(f) => void handleFiles(f)}
          accept=".pdf,application/pdf"
          multiple={false}
          label="Upload PDF"
          sublabel="Study material, textbook, or notes"
        />
      ) : (
        <ToolUploadedFileCard file={file} onRemove={reset} className="mb-3" />
      )}
      {busy ? (
        <AiProcessingSteps progress={premiumCloud.progress ?? 50} label="Generating questions..." />
      ) : null}
      {!busy && file && !session ? deferredPanel : null}
      {questionResultsList}
    </MobileToolLayout>
  );

  const desktopPage = (
    <div className="hidden lg:flex h-[calc(100dvh-4rem)] w-full overflow-hidden">
      <DesktopMiniSidebar activeSlug="ai-question-gen" />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto border-border bg-muted/20 p-4 lg:max-w-[40%] lg:border-r">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AI Question Generator</h1>
          </div>
          {!file ? (
            <ToolUploadSlot
              files={[]}
              onFiles={(f) => void handleFiles(f)}
              accept=".pdf,application/pdf"
              multiple={false}
              label="Upload PDF"
              sublabel="Study material, textbook, or notes"
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
              <button type="button" className="text-sm text-muted-foreground underline" onClick={reset}>
                Remove file
              </button>
              <div className="space-y-4 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Settings2 className="h-4 w-4" />
                  Question Settings
                </div>
                {settingsPanel}
                {deferredPanel}
                {file && !session && !busy ? (
                  <Button onClick={() => void startGenerateFlow()} className="h-11 w-full gap-2 rounded-xl font-bold">
                    <GraduationCap className="h-5 w-5" />
                    {isSignedIn ? "Generate Questions" : "Continue with Google — Generate"}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </section>
        <section
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-6",
            !file && "items-center justify-center",
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {!file && (
              <div className="text-center text-muted-foreground">
                <HelpCircle className="mx-auto mb-4 h-12 w-12 opacity-40" />
                <p className="text-lg font-medium">Upload a PDF to get started</p>
                <p className="mt-1 text-sm">AI will generate questions from your document</p>
              </div>
            )}
            {busy && <AiProcessingSteps progress={premiumCloud.progress ?? 50} label="Generating questions..." />}
            {questionResultsList}
            {!session && !busy && file && (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
                <GraduationCap className="mx-auto mb-4 h-12 w-12 opacity-40" />
                <p className="text-lg font-medium">Ready to generate</p>
                <p className="mt-1 text-sm">Configure settings and click Generate Questions</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <ToolRenderErrorBoundary onReset={reset}>
      <ToolSEO
        title="AI Question Generator from PDF — Free Online | PDFTrusted"
        description="Generate MCQs, true/false, short answer, and fill-in-the-blank questions from any PDF using AI. Perfect for students and teachers."
        slug="ai-question-gen"
      />
      <ToolPageSplit desktop={desktopPage} mobile={mobilePage} />
    </ToolRenderErrorBoundary>
  );
}
