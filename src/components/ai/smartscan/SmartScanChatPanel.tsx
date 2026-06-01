"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Wand2, Copy, Check, Paperclip, X } from "lucide-react";
import { AIChatInterface } from "@/components/ai/AIChatInterface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type ChatTurn = { role: "user" | "assistant"; content: string };

const QUICK_EDITS = [
  "Add a signature line and date at the bottom",
  "Fix spelling and grammar throughout",
  "Add page numbers to each page",
  "Make all headings bold and consistent",
  "Translate the entire document to English",
  "Add a standard confidentiality footer",
] as const;

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

type PendingAttachment = {
  name: string;
  mimeType: string;
  base64: string;
  previewUrl: string;
};

type Props = {
  jobId: string | null;
  onRevisedPdf: (blob: Blob, filename: string) => void;
  baseFilename: string;
  className?: string;
};

function readFileAsAttachment(file: File): Promise<PendingAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const base64 = result.replace(/^data:[^;]+;base64,/, "");
      resolve({
        name: file.name,
        mimeType: file.type || "image/png",
        base64,
        previewUrl: result,
      });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function SmartScanChatPanel({ jobId, onRevisedPdf, baseFilename, className }: Props) {
  const [sessionReady, setSessionReady] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content:
        "Your document is reconstructed. Ask anything, describe edits, or attach a logo/signature and tell me where to place it — then click Apply.",
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [reviseBusy, setReviseBusy] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatBusy, reviseBusy]);

  useEffect(() => {
    if (!jobId) {
      setSessionReady(false);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      for (let i = 0; i < 40; i += 1) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/ai/session/${jobId}`, { credentials: "include" });
          if (res.status === 202) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          if (res.ok) {
            const data = (await res.json()) as {
              session?: { suggestedQuestions?: string[]; documentExcerpt?: string };
            };
            if (data.session?.documentExcerpt || data.session?.suggestedQuestions?.length) {
              setSuggested(data.session.suggestedQuestions ?? []);
              setSessionReady(true);
              return;
            }
          }
        } catch {
          /* retry */
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const applyRevision = useCallback(
    async (instruction: string) => {
      if (!jobId || !instruction.trim()) return;
      setReviseBusy(true);
      const attachNote =
        attachments.length > 0
          ? ` (${attachments.length} attachment${attachments.length > 1 ? "s" : ""})`
          : "";
      setMessages((m) => [...m, { role: "user", content: `Apply edit: ${instruction.trim()}${attachNote}` }]);
      try {
        const res = await fetch("/api/ai/smart-scan/revise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            jobId,
            instruction: instruction.trim(),
            attachments: attachments.map(({ name, mimeType, base64 }) => ({ name, mimeType, base64 })),
          }),
        });
        const data = (await res.json()) as { pdfBase64?: string; message?: string; error?: string };
        if (!res.ok) {
          throw new Error(data.message ?? data.error ?? "Could not apply edit");
        }
        if (!data.pdfBase64) throw new Error("No PDF returned");
        const binary = atob(data.pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/pdf" });
        const name = baseFilename.replace(/\.pdf$/i, "") + "_edited.pdf";
        onRevisedPdf(blob, name);
        setAttachments([]);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "Done — I applied your edit and regenerated the PDF. Download the updated file or keep editing.",
          },
        ]);
        toast({ title: "PDF updated", description: "Your revised document is ready to download." });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Edit failed";
        setMessages((m) => [...m, { role: "assistant", content: `Could not apply that edit: ${msg}` }]);
        toast({ title: "Edit failed", description: msg, variant: "destructive" });
      } finally {
        setReviseBusy(false);
        setInput("");
      }
    },
    [jobId, baseFilename, onRevisedPdf, attachments],
  );

  const sendChat = useCallback(async () => {
    const text = input.trim();
    if (!text || !jobId || chatBusy || reviseBusy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setChatBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobId,
          message: text,
          messages: messages.filter((m) => m.role === "user" || m.role === "assistant"),
          aiTier: "standard",
        }),
      });
      const data = (await res.json()) as { reply?: string; message?: string; error?: string };
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Chat failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "No response." }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Chat failed";
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setChatBusy(false);
    }
  }, [input, jobId, chatBusy, reviseBusy, messages]);

  const onPickAttachments = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingAttachment[] = [...attachments];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_ATTACHMENTS) break;
      if (!file.type.startsWith("image/")) {
        toast({ title: "Images only", description: "Attach PNG, JPG, or WEBP files.", variant: "destructive" });
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast({ title: "File too large", description: "Each attachment must be under 2 MB.", variant: "destructive" });
        continue;
      }
      try {
        next.push(await readFileAsAttachment(file));
      } catch {
        toast({ title: "Upload failed", description: file.name, variant: "destructive" });
      }
    }
    setAttachments(next.slice(0, MAX_ATTACHMENTS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [attachments]);

  const busy = chatBusy || reviseBusy;
  const chips = [...QUICK_EDITS, ...suggested].slice(0, 4);

  const footer = (
    <div className="space-y-2">
      {attachments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <div
              key={`${att.name}-${idx}`}
              className="relative flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-2 py-1.5"
            >
              <img src={att.previewUrl} alt="" className="h-8 w-8 rounded object-cover" />
              <span className="max-w-[100px] truncate text-[10px] font-medium">{att.name}</span>
              <button
                type="button"
                aria-label={`Remove ${att.name}`}
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => setAttachments((a) => a.filter((_, i) => i !== idx))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={!sessionReady || busy || !jobId}
            onClick={() => void applyRevision(chip)}
            className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium text-violet-800 transition hover:bg-violet-500/20 disabled:opacity-50 dark:text-violet-200"
          >
            {chip.length > 42 ? `${chip.slice(0, 40)}…` : chip}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void onPickAttachments(e.target.files)}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={!sessionReady || busy || attachments.length >= MAX_ATTACHMENTS}
          onClick={() => fileInputRef.current?.click()}
          className="h-11 w-11 shrink-0 rounded-xl"
          aria-label="Attach image for AI edit"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendChat();
            }
          }}
          disabled={!sessionReady || busy || !jobId}
          placeholder={
            sessionReady
              ? attachments.length
                ? "Describe where to place the attachment…"
                : "Ask about the doc or describe an edit to apply…"
              : "Preparing AI session…"
          }
          className="min-h-[44px] flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
          aria-label="Smart Scan AI chat and edit"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={!sessionReady || busy || !input.trim() || !jobId}
          onClick={() => void sendChat()}
          className="h-11 w-11 shrink-0 rounded-xl"
          aria-label="Ask AI"
        >
          {chatBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          disabled={!sessionReady || busy || !input.trim() || !jobId}
          onClick={() => void applyRevision(input)}
          className="h-11 shrink-0 gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 text-xs font-bold hover:from-violet-700 hover:to-fuchsia-700"
        >
          {reviseBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Apply
        </Button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground">
        Attach logo/signature · Ask = Q&amp;A · Apply = regenerate PDF
      </p>
    </div>
  );

  return (
    <AIChatInterface
      title="Smart Scan AI Assistant"
      statusLabel={
        reviseBusy ? "Applying edit…" : chatBusy ? "Thinking…" : sessionReady ? "Ready to edit" : "Loading session…"
      }
      statusOnline={sessionReady && !busy}
      footer={footer}
      showPrivacyBadge={false}
      className={cn("h-full min-h-0", className)}
    >
      <div className="space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={`${idx}-${msg.role}`}
            className={cn(
              "group relative max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto border border-border bg-muted/50 text-foreground",
            )}
          >
            {msg.content}
            {msg.role === "assistant" && msg.content.length > 20 ? (
              <button
                type="button"
                className="absolute -bottom-1 right-1 opacity-0 transition group-hover:opacity-100"
                aria-label="Copy"
                onClick={() => {
                  void navigator.clipboard.writeText(msg.content);
                  setCopiedIdx(idx);
                  setTimeout(() => setCopiedIdx(null), 1500);
                }}
              >
                {copiedIdx === idx ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-violet-500" />
            {reviseBusy ? "Regenerating your PDF…" : "AI is thinking…"}
          </div>
        ) : null}
        <div ref={chatEndRef} />
      </div>
    </AIChatInterface>
  );
}
