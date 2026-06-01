import { safeDownloadBlob } from "@/lib/download/safeDownload";

type ChatTurn = { role: "user" | "assistant"; content: string };

export function formatChatTranscript(
  turns: ChatTurn[],
  meta?: { title?: string; fileName?: string },
): string {
  const lines: string[] = [];
  if (meta?.title) lines.push(meta.title, "");
  if (meta?.fileName) lines.push(`Document: ${meta.fileName}`, "");
  for (const m of turns) {
    const label = m.role === "user" ? "You" : "PDFTrusted AI";
    lines.push(`${label}:`, m.content, "");
  }
  return lines.join("\n").trim();
}

export function downloadChatTranscript(
  turns: ChatTurn[],
  filename: string,
  meta?: { title?: string; fileName?: string },
): void {
  const text = formatChatTranscript(turns, meta);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  void safeDownloadBlob(blob, filename);
}
