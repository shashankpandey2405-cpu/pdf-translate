"use client";

import { useState, useCallback } from "react";
import ToolSEO from "@/components/ToolSEO";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { Layers, Download, RotateCcw, CheckCircle2 } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { safeDownloadBlob } from "@/lib/download/safeDownload";

type Stage = "upload" | "processing" | "done";

export default function FlattenPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setStage("upload");
    setResultBlob(null);
    setResultName("");
  }, []);

  const flatten = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    try {
      const buf = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      try {
        const form = pdfDoc.getForm();
        form.flatten();
      } catch {
        /* no form fields */
      }
      const flatBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(flatBytes).buffer], { type: "application/pdf" });
      const name = file.name.replace(/\.pdf$/i, "") + "_flattened.pdf";
      setResultBlob(blob);
      setResultName(name);
      setStage("done");
      toast({ title: "PDF flattened successfully" });
    } catch (e) {
      console.error("[flatten-pdf]", e);
      toast({
        title: "Failed to flatten PDF",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
      setStage("upload");
    }
  }, [file]);

  const reset = useCallback(() => {
    setFile(null);
    setStage("upload");
    setResultBlob(null);
    setResultName("");
  }, []);

  const workflowStage: ToolWorkflowStage = stage;

  const shell = (
    <ToolWorkflowShell
      stage={workflowStage}
      toolSlug="flatten-pdf"
      processingTitle="Flattening form fields…"
      upload={
        <ToolUploadSlot
          files={file ? [file] : []}
          onFiles={onDrop}
          accept=".pdf,application/pdf"
          multiple={false}
          label="Drop your PDF here"
          sublabel="PDF with form fields or annotations"
          onRemoveFile={reset}
        />
      }
      configure={
        file ? (
          <p className="text-center text-sm text-muted-foreground">
            Form fields and annotations will be burned into static content.
          </p>
        ) : null
      }
      processingContent={<ProcessingStatus type="instant" label="Flattening form fields…" className="py-10" />}
      done={
        resultBlob ? (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-7 w-7" />
              <span className="text-lg font-semibold">PDF flattened</span>
            </div>
            <button
              type="button"
              onClick={() => void safeDownloadBlob(resultBlob, resultName)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white"
            >
              <Download className="h-5 w-5" />
              Download
            </button>
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Flatten another
            </Button>
          </div>
        ) : (
          <div />
        )
      }
    />
  );

  const desktop = (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Layers className="h-4 w-4" />
          Flatten PDF
        </div>
        <h1 className="text-3xl font-bold text-foreground">Flatten PDF Forms & Annotations</h1>
        <p className="mt-2 text-muted-foreground">
          Convert interactive form fields into static content before sharing.
        </p>
      </div>
      {shell}
      {stage === "upload" && file ? (
        <Button size="lg" onClick={() => void flatten()} className="mt-4 w-full gap-2">
          <Layers className="h-5 w-5" />
          Flatten PDF
        </Button>
      ) : null}
    </div>
  );

  const mobile = (
    <MobileToolLayout
      slug="flatten-pdf"
      toolLabel="Flatten PDF"
      title="Flatten PDF"
      workflowStep={stage === "upload" ? "upload" : stage === "processing" ? "process" : "done"}
      processButton={
        stage === "upload" && file ? (
          <button type="button" onClick={() => void flatten()} className={TOOL_PRIMARY_BTN}>
            <Layers className="h-5 w-5" />
            Flatten PDF
          </button>
        ) : null
      }
      postProcessPanel={
        resultBlob ? (
          <MobilePostProcessPanel
            currentSlug="flatten-pdf"
            onDownload={() => void safeDownloadBlob(resultBlob, resultName)}
            onProcessAnother={reset}
            downloadLabel="Download flattened PDF"
          />
        ) : undefined
      }
    >
      {shell}
    </MobileToolLayout>
  );

  return (
    <ToolRenderErrorBoundary onReset={reset}>
      <ToolSEO
        title="Flatten PDF Forms & Annotations Online — Free | PDFTrusted"
        description="Flatten PDF form fields and annotations into static content. Free browser-based tool, no upload needed."
        slug="flatten-pdf"
      />
      <ToolPageSplit desktop={desktop} mobile={mobile} />
    </ToolRenderErrorBoundary>
  );
}
