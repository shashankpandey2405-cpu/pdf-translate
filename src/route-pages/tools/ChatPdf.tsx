"use client";

import dynamic from "next/dynamic";
import { ToolRouteShell } from "@/components/tools/ToolRouteShell";
import ToolSEO from "@/components/ToolSEO";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";

const ChatPdfWorkspace = dynamic(
  () => import("@/components/ai/chat/ChatPdfWorkspace").then((m) => ({ default: m.ChatPdfWorkspace })),
  {
    loading: () => <ProcessingStatus type="ai" label="Loading Chat PDF…" className="min-h-[50vh]" />,
  },
);

export default function ChatPdf() {
  return (
    <ToolRouteShell
      slug="chat-pdf"
      toolName="Chat with PDF"
      seoTitle="Chat with PDF — PDFTrusted AI"
      seoDescription="Upload any PDF and ask questions. Get instant, accurate answers directly from your document powered by AI."
    >
      <div className="hidden lg:block">
        <ToolSEO
          title="Chat with PDF — PDFTrusted AI"
          description="Upload any PDF and ask questions. Get instant, accurate answers directly from your document powered by AI."
          slug="chat-pdf"
        />
      </div>
      <ChatPdfWorkspace />
    </ToolRouteShell>
  );
}
