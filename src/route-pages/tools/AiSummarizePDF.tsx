"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ToolRouteShell } from "@/components/tools/ToolRouteShell";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";

const AiSummarizeWorkspace = dynamic(
  () =>
    import("@/components/ai/summarize/AiSummarizeWorkspace").then((m) => ({
      default: m.AiSummarizeWorkspace,
    })),
  {
    loading: () => <ProcessingStatus type="ai" label="Loading AI Summarize…" className="min-h-[50vh]" />,
  },
);

export default function AiSummarizePDF() {
  const [outputLang, setOutputLang] = useState("en");

  return (
    <ToolRouteShell
      slug="ai-summarize"
      toolName="AI Summarize"
      seoTitle="AI PDF Summarizer — PDFTrusted"
      seoDescription="Summarize PDFs with Standard or Advanced AI, chat with your document, and download a summary PDF."
    >
      <AiSummarizeWorkspace outputLang={outputLang} onOutputLangChange={setOutputLang} />
    </ToolRouteShell>
  );
}
