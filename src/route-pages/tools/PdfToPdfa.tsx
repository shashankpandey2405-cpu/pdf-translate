"use client";

import { useState, useCallback } from "react";
import { ToolUploadedFileCard } from "@/components/tools/ux/ToolUploadedFileCard";
import type { ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { DesktopMiniSidebar } from "@/components/desktop/DesktopMiniSidebar";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { safeDownloadBlob, shareBlob } from "@/lib/download/safeDownload";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  convertToPdfA,
  getPdfaConformanceInfo,
  type PdfaConformance,
  type PdfaOptions,
} from "@/lib/processing/pdfaConverter";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import {
  ShieldCheck,
  Download,
  FileCheck,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Building2,
  Scale,
  Globe,
  Receipt,
  Info,
  CheckCircle2,
} from "lucide-react";

const CONFORMANCE_LEVELS: {
  id: PdfaConformance;
  label: string;
  badge: string;
  icon: typeof Building2;
  color: string;
}[] = [
  {
    id: "1b",
    label: "PDF/A-1b",
    badge: "Most Compatible",
    icon: Building2,
    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  },
  {
    id: "2b",
    label: "PDF/A-2b",
    badge: "Recommended",
    icon: FileCheck,
    color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  },
  {
    id: "3b",
    label: "PDF/A-3b",
    badge: "Latest Standard",
    icon: Receipt,
    color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800",
  },
];

export default function PdfToPdfa() {
  const [file, setFile] = useState<File | null>(null);
  const [conformance, setConformance] = useState<PdfaConformance>("2b");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    blob: Blob;
    conformance: string;
    pageCount: number;
    filename: string;
  } | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setTitle(f.name.replace(/\.pdf$/i, ""));
  }, []);

  const startConversion = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setResult(null);

    try {
      const inputBytes = new Uint8Array(await file.arrayBuffer());

      const opts: PdfaOptions = {
        conformance,
        title: title.trim() || undefined,
        author: author.trim() || undefined,
        subject: subject.trim() || undefined,
      };

      const res = await convertToPdfA(inputBytes, opts);
      const blob = new Blob([new Uint8Array(res.bytes).buffer], { type: "application/pdf" });
      const originalName = file.name.replace(/\.pdf$/i, "");
      const filename = `${originalName}_${res.conformance.replace("/", "-")}.pdf`;

      setResult({
        blob,
        conformance: res.conformance,
        pageCount: res.pageCount,
        filename,
      });

      toast({ title: "Conversion complete", description: `${res.conformance} · ${res.pageCount} pages` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Conversion failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }, [file, conformance, title, author, subject]);

  const downloadResult = () => {
    if (!result) return;
    void safeDownloadBlob(result.blob, result.filename);
  };

  const startOver = () => {
    setFile(null);
    setResult(null);
    setTitle("");
    setAuthor("");
    setSubject("");
  };

  const confInfo = getPdfaConformanceInfo(conformance);

  const pdfaHonestNotice = (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Private Local mode</span> embeds PDF/A conformance metadata (XMP) — it is{" "}
        <span className="font-semibold">not</span> full ISO distillation like Acrobat or server PDF/A engines. Use for
        tagging and workflow hints; verify with your compliance team before regulated archival submission.
      </p>
    </div>
  );

  const conformanceSelector = (
    <div className="space-y-4">
      {pdfaHonestNotice}
      <div className="space-y-2.5">
        <Label className="text-sm font-semibold">Conformance Level</Label>
        <div className="space-y-2">
          {CONFORMANCE_LEVELS.map((level) => {
            const selected = conformance === level.id;
            const Icon = level.icon;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setConformance(level.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                  selected
                    ? level.color
                    : "border-border bg-card hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", selected ? "" : "text-muted-foreground")} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", selected ? "" : "text-foreground")}>
                      {level.label}
                    </span>
                    {level.id === "2b" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs", selected ? "opacity-80" : "text-muted-foreground")}>
                    {level.badge}
                  </p>
                </div>
                {selected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-foreground">{confInfo.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{confInfo.description}</p>
            <p className="mt-1 text-[11px] text-primary">{confInfo.useCase}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm hover:bg-muted/50"
      >
        <span className="font-medium text-foreground">Document Metadata</span>
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-3">
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Author</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Document subject" className="mt-1 h-9 text-sm" />
          </div>
        </div>
      )}
    </div>
  );

  const mobileWorkflowStep: ToolWorkflowStepId = !file
    ? "upload"
    : result
      ? "done"
      : processing
        ? "process"
        : "configure";

  const mobileProcessButton = !file ? null : result ? null : (
    <button
      type="button"
      onClick={() => void startConversion()}
      disabled={processing}
      className={TOOL_PRIMARY_BTN}
    >
      <ShieldCheck className="h-5 w-5" />
      {processing ? "Converting…" : `Convert to ${CONFORMANCE_MAP_LABEL[conformance]}`}
    </button>
  );

  const mobilePage = (
      <MobileToolLayout
        slug="pdf-to-pdfa"
        toolLabel="PDF to PDF/A"
        title="PDF to PDF/A"
        workflowStep={mobileWorkflowStep}
        settingsPanel={file && !result ? conformanceSelector : undefined}
        autoOpenSettings={Boolean(file && !result && !processing)}
        processButton={mobileProcessButton}
        postProcessPanel={
          result ? (
            <MobilePostProcessPanel
              currentSlug="pdf-to-pdfa"
              onDownload={downloadResult}
              onShare={() => void shareBlob(result.blob, result.filename)}
              onProcessAnother={startOver}
              downloadLabel={`Download ${result.conformance}`}
            />
          ) : undefined
        }
      >
        {!file ? (
          <ToolUploadSlot
            files={[]}
            onFiles={handleFiles}
            accept=".pdf,application/pdf"
            multiple={false}
            label="Drop your PDF here"
            sublabel="Convert to archival PDF/A format"
          />
        ) : result ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Conversion Complete</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Converted to <span className="font-semibold text-primary">{result.conformance}</span> format.
            </p>
            <div className="mt-6 w-full max-w-xs space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="font-semibold text-foreground">{result.conformance}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-semibold text-foreground">{result.pageCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="font-semibold text-foreground">{(result.blob.size / 1024).toFixed(0)} KB</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ToolUploadedFileCard file={file} onRemove={startOver} />
            {processing ? (
              <ProcessingStatus
                type="instant"
                label={`Converting to ${CONFORMANCE_MAP_LABEL[conformance]}…`}
                className="py-8"
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Open settings (gear) for conformance level, then tap Convert.
              </p>
            )}
          </div>
        )}
      </MobileToolLayout>
  );

  const desktopPage = (
      <div className="hidden lg:block">
        <div className="flex h-[calc(100dvh-64px)] w-full overflow-y-auto">
          <div className="hidden lg:block">
            <DesktopMiniSidebar activeSlug="pdf-to-pdfa" />
          </div>

          <div className="flex flex-1 flex-col lg:flex-row">
            <div className="w-full border-b border-border bg-muted/20 lg:w-[400px] lg:border-b-0 lg:border-r">
              <div className="p-4 lg:p-6">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">PDF to PDF/A</h1>
                    <p className="text-xs text-muted-foreground">ISO compliant archival format</p>
                  </div>
                </div>

                {!file ? (
                  <ToolUploadSlot
                    files={[]}
                    onFiles={handleFiles}
                    accept=".pdf,application/pdf"
                    multiple={false}
                    label="Drop your PDF here"
                    sublabel="Government, legal, and archival workflows"
                  />
                ) : (
                  <div className="space-y-5">
                    <div>
                      <ToolInputPreview file={file} />
                      <button type="button" onClick={startOver} className="mt-2 text-sm text-muted-foreground underline hover:text-foreground">
                        Remove file
                      </button>
                    </div>
                    {conformanceSelector}
                    {!result ? (
                      <Button onClick={() => void startConversion()} disabled={processing} className="h-12 w-full gap-2 rounded-xl text-base font-bold">
                        {processing ? <>Converting…</> : (
                          <>
                            <ShieldCheck className="h-5 w-5" />
                            Convert to {CONFORMANCE_MAP_LABEL[conformance]}
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button onClick={downloadResult} className="h-12 w-full gap-2 rounded-xl text-base font-bold">
                          <Download className="h-5 w-5" />
                          Download {result.conformance}
                        </Button>
                        <Button variant="outline" onClick={startOver} className="h-10 w-full gap-2 rounded-xl">
                          <RotateCcw className="h-4 w-4" />
                          Convert another PDF
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              {!file ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="max-w-lg text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                      <ShieldCheck className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Convert PDF to PDF/A</h2>
                    <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                      Transform any PDF into an ISO-standardized archival format for compliance and long-term preservation.
                    </p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <Building2 className="mx-auto h-6 w-6 text-blue-500" />
                        <h3 className="mt-2 text-sm font-semibold">Government</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">Court filings, tax submissions</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <Scale className="mx-auto h-6 w-6 text-green-500" />
                        <h3 className="mt-2 text-sm font-semibold">Legal</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">Contracts, evidence, compliance</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <Globe className="mx-auto h-6 w-6 text-purple-500" />
                        <h3 className="mt-2 text-sm font-semibold">EU / ISO</h3>
                        <p className="mt-1 text-[11px] text-muted-foreground">ZUGFeRD, e-invoicing, archival</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : result ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Conversion Complete</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your PDF has been converted to{" "}
                      <span className="font-semibold text-primary">{result.conformance}</span>.
                    </p>
                    <div className="mx-auto mt-6 max-w-xs space-y-2 rounded-2xl border border-border bg-card p-4 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Format</span>
                        <span className="font-semibold text-foreground">{result.conformance}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pages</span>
                        <span className="font-semibold text-foreground">{result.pageCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-semibold text-foreground">{(result.blob.size / 1024).toFixed(0)} KB</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8">
                  {processing ? (
                    <ProcessingStatus type="instant" label={`Converting to ${CONFORMANCE_MAP_LABEL[conformance]}…`} className="py-4" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Select conformance and click Convert</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );

  return (
    <ToolRenderErrorBoundary onReset={startOver}>
      <ToolSEO
        title="PDF to PDF/A Converter — ISO Compliant Archival | PDFTrusted"
        description="Convert PDF to PDF/A-1b, PDF/A-2b, or PDF/A-3b format for government compliance, legal archival, and long-term preservation. Free online tool."
        slug="pdf-to-pdfa"
      />
      <ToolPageSplit desktop={desktopPage} mobile={mobilePage} />
    </ToolRenderErrorBoundary>
  );
}

const CONFORMANCE_MAP_LABEL: Record<PdfaConformance, string> = {
  "1b": "PDF/A-1b",
  "2b": "PDF/A-2b",
  "3b": "PDF/A-3b",
};
