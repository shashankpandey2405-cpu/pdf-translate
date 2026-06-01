"use client";

import { useCallback, useState } from "react";
import { Copy, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { aiToolChatPanelClass } from "@/components/ai/aiToolLayout";
import { toast } from "@/hooks/use-toast";
import type { AiSummarizeTier } from "@/lib/ai/summarizeTier";
import { NeuralWaveLoader } from "@/components/ai/NeuralWaveLoader";
import { AIChatInterface } from "@/components/ai/AIChatInterface";

export type ChatTurn = { role: "user" | "assistant"; content: string };

type Props = {
  summaryText: string;
  suggestedQuestions: string[];
  aiTier: AiSummarizeTier;
  jobId: string | null;
  busy?: boolean;
  onDownload?: () => void;
  downloadDisabled?: boolean;
  className?: string;
};

export function AiSummaryChatPanel({
  summaryText,
  suggestedQuestions,
  aiTier,
  jobId,
  busy,
  onDownload,
  downloadDisabled,
  className,
}: Props) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !jobId || chatBusy) return;

      setChatBusy(true);
      const prior = messages;
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ jobId, message: trimmed, messages: prior, aiTier }),
        });
        const data = (await res.json()) as { reply?: string; message?: string; creditsCharged?: number };
        if (!res.ok) throw new Error(data.message ?? "Chat failed");
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "" }]);
      } catch (e) {
        toast({
          title: "Could not send message",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
        setMessages(prior);
      } finally {
        setChatBusy(false);
      }
    },
    [aiTier, chatBusy, jobId, messages],
  );

  const headerAction =
    onDownload ? (
      <Button type="button" size="sm" disabled={downloadDisabled} onClick={onDownload} className="gap-1">
        <Download className="h-4 w-4" />
        Download
      </Button>
    ) : null;

  return (
    <AIChatInterface
      title="PDF Intelligence"
      statusLabel={busy ? "Processing…" : "Neural AI Online"}
      statusOnline={!busy}
      headerAction={headerAction}
      showPrivacyBadge
      className={cn(aiToolChatPanelClass, className)}
      footer={
        <>
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void sendMessage(input)}
              placeholder="Ask anything about the document…"
              disabled={!jobId || chatBusy || !summaryText}
              className="w-full rounded-2xl border border-border/60 bg-background px-5 py-3 pr-12 text-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
            />
            <Button
              type="button"
              size="icon"
              disabled={!jobId || chatBusy || !input.trim() || !summaryText}
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
          <p className="mt-2 text-[10px] text-muted-foreground">
            Answers come only from your uploaded file.
          </p>
        </>
      }
    >
      {busy ? (
        <NeuralWaveLoader label="Generating summary…" />
      ) : summaryText ? (
        <div className="space-y-4">
          <div className="mb-2 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1"
              onClick={() => {
                void navigator.clipboard.writeText(summaryText);
                toast({ title: "Copied" });
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <div className="max-w-[90%] rounded-2xl bg-muted/50 px-4 py-3 text-sm italic leading-relaxed text-foreground">
            <SummaryBody text={summaryText} />
          </div>
          {!busy && suggestedQuestions.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground">Suggested questions</p>
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  className="press-scale w-full rounded-xl border border-border px-3 py-2.5 text-left text-sm hover:border-primary/40 hover:bg-primary/5 active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : null}
          {messages.length > 0 ? (
            <div className="space-y-2 border-t border-border/50 pt-4">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-primary/10 text-foreground"
                      : "mr-auto bg-muted/60 text-foreground",
                  )}
                >
                  {m.content}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="max-w-[90%] rounded-2xl bg-muted/50 px-4 py-3 text-sm italic text-muted-foreground">
          I&apos;ve analyzed your PDF. Upload and run summarize — then ask me to explain sections, find data, or
          dig deeper.
        </p>
      )}
    </AIChatInterface>
  );
}

function SummaryBody({ text }: { text: string }) {
  return (
    <div className="space-y-2 not-italic">
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
