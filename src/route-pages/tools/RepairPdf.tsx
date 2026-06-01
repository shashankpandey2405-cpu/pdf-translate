"use client";

import { useState, useCallback } from "react";
import { Wrench, Download, RotateCcw, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { ToolWorkflowShell, type ToolWorkflowStage } from "@/components/tools/ToolWorkflowShell";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import {
  repairPdf,
  getRepairedFilename,
  type RepairMode,
  type RepairPdfReport,
} from "@/tools/repair-pdf/logic";
import { content } from "@/tools/repair-pdf/content";

type Stage = "upload" | "configure" | "processing" | "done";

const MODE_OPTIONS: { id: RepairMode; label: string; desc: string }[] = [
  { id: "quick", label: "Quick repair", desc: "Fast rebuild — best for minor corruption" },
  { id: "deep", label: "Deep repair", desc: "Multi-pass MuPDF + page rebuild — severe damage" },
];

function RepairReportCard({ report }: { report: RepairPdfReport }) {
  return (
    <div className="space-y-2 rounded-2xl border border-emerald-500/25 bg-emerald-50/50 p-4 text-sm dark:bg-emerald-950/20">
      <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
        <CheckCircle2 className="h-5 w-5" />
        Repair complete ({report.method})
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <dt>Pages</dt>
        <dd className="font-medium text-foreground">{report.pageCount}</dd>
        <dt>Mode</dt>
        <dd className="font-medium text-foreground capitalize">{report.mode}</dd>
        <dt>Size</dt>
        <dd className="font-medium text-foreground">
          {(report.originalSizeBytes / 1024).toFixed(0)} KB → {(report.outputSizeBytes / 1024).toFixed(0)} KB
        </dd>
        <dt>Passes</dt>
        <dd className="font-medium text-foreground">{report.passesAttempted.join(", ")}</dd>
      </dl>
      {report.warnings.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-200">
          {report.warnings.map((w) => (
            <li key={w} className="flex gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {w}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function RepairPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<RepairMode>("quick");
  const [stage, setStage] = useState<Stage>("upload");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState("");
  const [report, setReport] = useState<RepairPdfReport | null>(null);

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setStage("configure");
    setResultBlob(null);
    setResultName("");
    setReport(null);
  }, []);

  const runRepair = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    try {
      const { bytes, report: r } = await repairPdf(file, mode);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const name = getRepairedFilename(file);
      setResultBlob(blob);
      setResultName(name);
      setReport(r);
      setStage("done");
      toast({ title: "PDF repaired", description: `${r.pageCount} pages recovered via ${r.method}.` });
    } catch (e) {
      console.error("[repair-pdf]", e);
      toast({
        title: "Repair failed",
        description: e instanceof Error ? e.message : "Could not repair this file.",
        variant: "destructive",
      });
      setStage("configure");
    }
  }, [file, mode]);

  const reset = useCallback(() => {
    setFile(null);
    setStage("upload");
    setResultBlob(null);
    setResultName("");
    setReport(null);
  }, []);

  const settingsPanel = (
    <div className="space-y-3">
      <Label className="text-xs">Repair mode</Label>
      {MODE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setMode(opt.id)}
          className={cn(
            "w-full rounded-xl border p-3 text-left transition-colors",
            mode === opt.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40",
          )}
        >
          <p className="text-sm font-semibold">{opt.label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{opt.desc}</p>
        </button>
      ))}
    </div>
  );

  const workflowStage: ToolWorkflowStage =
    stage === "upload" ? "upload" : stage === "processing" ? "processing" : stage === "done" ? "done" : "configure";

  const shell = (
    <ToolWorkflowShell
      stage={workflowStage}
      toolSlug="repair-pdf"
      processingTitle="Repairing PDF structure…"
      upload={
        <ToolUploadSlot
          files={file ? [file] : []}
          onFiles={onDrop}
          accept=".pdf,application/pdf"
          multiple={false}
          label="Drop damaged PDF"
          sublabel="Broken xref, slow open, or export errors"
          onRemoveFile={reset}
        />
      }
      configure={
        file && stage !== "done" ? (
          <p className="text-center text-sm text-muted-foreground">
            {mode === "deep"
              ? "Runs pdf-lib, MuPDF rewrite, and full page rebuild in your browser."
              : "Rebuilds document structure with automatic fallback."}
          </p>
        ) : null
      }
      processingContent={<ProcessingStatus type="instant" label="Repairing PDF…" className="py-10" />}
      done={
        resultBlob && report ? (
          <div className="space-y-4 py-4">
            <RepairReportCard report={report} />
            <Button onClick={() => void safeDownloadBlob(resultBlob, resultName)} className="h-12 w-full gap-2 rounded-xl font-bold">
              <Download className="h-5 w-5" />
              Download repaired PDF
            </Button>
            <Button variant="outline" onClick={reset} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" />
              Repair another
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
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
          <Wrench className="h-4 w-4" />
          {content.hero.title}
        </div>
        <h1 className="text-3xl font-bold">{content.hero.title}</h1>
        <p className="mt-2 text-muted-foreground">{content.hero.subtitle}</p>
      </div>
      <div className="mb-4 rounded-2xl border border-border bg-card/80 p-4">{settingsPanel}</div>
      {shell}
      {stage === "configure" && file ? (
        <Button size="lg" onClick={() => void runRepair()} className="mt-4 w-full gap-2">
          <ShieldCheck className="h-5 w-5" />
          Run {mode === "deep" ? "deep" : "quick"} repair
        </Button>
      ) : null}
    </div>
  );

  const mobile = (
    <MobileToolLayout
      slug="repair-pdf"
      toolLabel="Repair PDF"
      title={content.hero.title}
      workflowStep={stage === "upload" ? "upload" : stage === "processing" ? "process" : stage === "done" ? "done" : "configure"}
      settingsPanel={file && stage !== "done" ? settingsPanel : undefined}
      autoOpenSettings={Boolean(file && stage === "configure")}
      processButton={
        file && stage === "configure" ? (
          <button type="button" onClick={() => void runRepair()} className={TOOL_PRIMARY_BTN}>
            <Wrench className="h-5 w-5" />
            Repair PDF
          </button>
        ) : null
      }
      postProcessPanel={
        resultBlob ? (
          <MobilePostProcessPanel
            currentSlug="repair-pdf"
            onDownload={() => void safeDownloadBlob(resultBlob, resultName)}
            onProcessAnother={reset}
            downloadLabel="Download repaired PDF"
          />
        ) : undefined
      }
    >
      {shell}
    </MobileToolLayout>
  );

  return (
    <ToolRenderErrorBoundary onReset={reset}>
      <ToolSEO title={content.hero.title} description={content.hero.subtitle} slug="repair-pdf" />
      <ToolPageSplit desktop={desktop} mobile={mobile} />
    </ToolRenderErrorBoundary>
  );
}
