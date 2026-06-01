"use client";

import { useCallback, useState } from "react";
import { Copy, Download, RefreshCw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { AiFocusShell } from "@/components/ai/workflow/AiFocusShell";
import type { AiSummarizeTier, SummaryLength } from "@/lib/ai/summarizeTier";
import { SUMMARY_LENGTH_LABELS } from "@/lib/ai/summarizeTier";
import { langLabel } from "@/lib/ai/translateLanguages";

type Props = {
  fileName: string;
  outputLang: string;
  length: SummaryLength;
  tier: AiSummarizeTier;
  summaryText: string;
  suggestedQuestions: string[];
  onDownload?: () => void;
  onRegenerate?: () => void;
  onAskQuestion?: (q: string) => void;
  jobId: string | null;
  aiTier: AiSummarizeTier;
  className?: string;
};

export function AiSummaryResultView({
  fileName,
  outputLang,
  length,
  tier,
  summaryText,
  suggestedQuestions,
  onDownload,
  onRegenerate,
  onAskQuestion,
  className,
}: Props) {
  const [followUp, setFollowUp] = useState("");

  const copySummary = useCallback(() => {
    void navigator.clipboard.writeText(summaryText);
    toast({ title: "Copied to clipboard" });
  }, [summaryText]);

  const exportTxt = useCallback(() => {
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fileName, summaryText]);

  return (
    <AiFocusShell maxWidth="result" className={className}>
      <div className="space-y-6">
        <header className="space-y-1 border-b border-border/60 pb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Document</p>
          <h1 className="truncate text-lg font-bold text-foreground">{fileName}</h1>
          <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1">{langLabel(outputLang)}</span>
            <span className="rounded-full bg-muted px-2.5 py-1">{SUMMARY_LENGTH_LABELS[length]}</span>
            <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{tier} AI</span>
          </div>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Generated summary</h2>
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 text-sm leading-relaxed text-foreground">
            <SummaryBody text={summaryText} />
          </div>
        </section>

        {suggestedQuestions.length > 0 && onAskQuestion ? (
          <section className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Suggested follow-ups</p>
            {suggestedQuestions.slice(0, 4).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onAskQuestion(q)}
                className="block w-full rounded-xl border border-border px-3 py-2.5 text-left text-sm hover:border-primary/40 hover:bg-primary/5"
              >
                {q}
              </button>
            ))}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={copySummary}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          {onDownload ? (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={exportTxt}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          {onRegenerate ? (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          ) : null}
        </div>

        {followUp ? (
          <p className="text-xs text-muted-foreground">{followUp}</p>
        ) : null}
      </div>
    </AiFocusShell>
  );
}

function SummaryBody({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/\n/).map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <p key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{trimmed.replace(/^[-•]\s*/, "")}</span>
            </p>
          );
        }
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}
