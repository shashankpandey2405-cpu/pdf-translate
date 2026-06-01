"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ToolRouteShell } from "@/components/tools/ToolRouteShell";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSLATE_LANG_OPTIONS } from "@/lib/ai/translateLanguages";

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

  const languageSettings = (
    <div className="space-y-2">
      <Label className="text-xs">Summary language</Label>
      <Select value={outputLang} onValueChange={setOutputLang}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRANSLATE_LANG_OPTIONS.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <ToolRouteShell
      slug="ai-summarize"
      toolName="AI Summarize"
      seoTitle="AI PDF Summarizer — PDFTrusted"
      seoDescription="Summarize PDFs with Standard or Advanced AI, chat with your document, and download a summary PDF."
    >
      <AiSummarizeWorkspace outputLang={outputLang} languageSettings={languageSettings} />
    </ToolRouteShell>
  );
}
