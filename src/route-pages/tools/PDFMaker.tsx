import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FileText, AlertCircle, CheckCircle, Bold, Italic } from "lucide-react";
import ToolSEO from "@/components/ToolSEO";
import { ToolRouteShell } from "@/components/tools/ToolRouteShell";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import SecurityBadge from "@/components/SecurityBadge";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import { useProcess } from "@/context/ProcessContext";
import { usePremium } from "@/context/PremiumContext";
import { createPDFFromText, getPDFMakerFilename, PDFMakerOptions } from "@/tools/pdf-maker/logic";
import { content as contentData } from "@/tools/pdf-maker/content";
import { logToolError } from "@/utils/logger";
import { nextProgress } from "@/lib/ui/monotonicProgress";
import { ToolResultPanel } from "@/components/tools/ToolResultPanel";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { safeDownloadBlob } from "@/lib/download/safeDownload";

const FONT_FAMILIES = [
  { value: "helvetica", label: "Helvetica", preview: "font-sans" },
  { value: "times", label: "Times", preview: "font-serif" },
  { value: "courier", label: "Courier", preview: "font-mono" },
] as const;

export default function PDFMaker() {
  const { i18n } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState<PDFMakerOptions["fontFamily"]>("helvetica");
  const [lineHeight, setLineHeight] = useState(1.5);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [stage, setStage] = useState<"create" | "processing" | "done">("create");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const { setProcessedFile } = useProcess();
  const { canUse } = usePremium();

  const handleCreatePDF = useCallback(async () => {
    if (!content.trim()) {
      setError("Please enter some content to create a PDF.");
      logToolError("pdf-maker", "validation_empty_content", new Error("empty_content"));
      return;
    }

    const check = canUse(1, 0); // No file size check needed for text-based creation
    if (!check.allowed) {
      setError(check.reason!);
      logToolError("pdf-maker", "upload_premium_blocked", new Error(check.reason ?? "blocked"));
      return;
    }

    setStage("processing");
    setProgress(0);
    setError(null);

    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      timer = setInterval(() => setProgress((p) => nextProgress(p, Math.min(p + 20, 88))), 200);

      const options: PDFMakerOptions = {
        title: title.trim(),
        content: content.trim(),
        fontSize,
        fontFamily,
        lineHeight,
        margins: { top: 72, bottom: 72, left: 72, right: 72 }, // 1 inch margins
        bold,
        italic,
      };

      const result = await createPDFFromText(options);
      setProgress(100);

      const blob = new Blob([result as BlobPart], { type: "application/pdf" });
      const filename = `${getPDFMakerFilename(title)}.pdf`;
      setProcessedFile({
        blob,
        filename,
        tool: "PDF Maker",
        toolSlug: "pdf-maker",
        originalSize: content.length,
        processedSize: result.length,
      });
      setResultBlob(blob);
      setResultFilename(filename);
      setStage("done");
    } catch (err) {
      logToolError("pdf-maker", "create_processing", err);
      setError(err instanceof Error ? err.message : "Failed to create PDF.");
      setStage("create");
    } finally {
      if (timer) clearInterval(timer);
    }
  }, [title, content, fontSize, fontFamily, lineHeight, bold, italic, canUse, setProcessedFile]);

  const resetWorkflow = useCallback(() => {
    setTitle("");
    setContent("");
    setFontSize(12);
    setFontFamily("helvetica");
    setLineHeight(1.5);
    setBold(false);
    setItalic(false);
    setStage("create");
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setResultFilename("");
    setProcessedFile(null);
  }, [setProcessedFile]);

  const editorBody = (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="hidden lg:block">
          <ToolSEO title={contentData.hero.title} description={contentData.hero.subtitle} slug="pdf-maker" lang={i18n.language} />
        </div>

        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{contentData.hero.title}</h1>
              <p className="text-sm text-muted-foreground">{contentData.hero.subtitle}</p>
              <SecurityBadge />
            </div>
          </div>

          <ToolWorkflowActions
            onReset={resetWorkflow}
            resetDisabled={stage === "processing"}
            className="mb-4"
          />

          {error && (
            <div className="mb-4 flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {stage === "create" && (
              <div>
                <div className="space-y-6">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Document Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter document title..."
                      className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Content Textarea */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type or paste your text content here..."
                      rows={12}
                      className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y min-h-[200px]"
                    />
                  </div>

                  {/* Formatting Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Font Family */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Font Family</label>
                      <div className="flex gap-2">
                        {FONT_FAMILIES.map((font) => (
                          <button
                            key={font.value}
                            onClick={() => setFontFamily(font.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                              fontFamily === font.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <span className={`text-xs ${font.preview}`}>Aa</span>
                            {font.label}
                            {fontFamily === font.value && <CheckCircle className="w-3 h-3 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Formatting */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Text Style</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBold(!bold)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                            bold ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <Bold className="w-4 h-4" />
                          Bold
                        </button>
                        <button
                          onClick={() => setItalic(!italic)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all ${
                            italic ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <Italic className="w-4 h-4" />
                          Italic
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Font Size and Line Height */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Font Size — <span className="text-primary">{fontSize}pt</span>
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="24"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Line Height — <span className="text-primary">{lineHeight}</span>
                      </label>
                      <input
                        type="range"
                        min="1.0"
                        max="2.0"
                        step="0.1"
                        value={lineHeight}
                        onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Live Preview</label>
                    <div className="bg-card border border-border rounded-xl p-6 min-h-[200px]">
                      {title && (
                        <h1
                          className={`text-xl font-bold mb-4 ${
                            fontFamily === "helvetica" ? "font-sans" :
                            fontFamily === "times" ? "font-serif" : "font-mono"
                          }`}
                        >
                          {title}
                        </h1>
                      )}
                      <div
                        className={`${
                          fontFamily === "helvetica" ? "font-sans" :
                          fontFamily === "times" ? "font-serif" : "font-mono"
                        } ${bold ? "font-bold" : ""} ${italic ? "italic" : ""}`}
                        style={{
                          fontSize: `${fontSize * 0.75}px`,
                          lineHeight: lineHeight,
                        }}
                      >
                        {content || "Start typing your content here..."}
                      </div>
                    </div>
                  </div>

                  {/* Create PDF Button */}
                  <button
                    onClick={handleCreatePDF}
                    disabled={!content.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Create PDF
                  </button>
                </div>
              </div>
            )}

            {stage === "processing" && (
              <div>
                <ProcessingStatus type="instant" progress={progress} label="Creating PDF…" className="py-20" />
              </div>
            )}

            {stage === "done" && resultBlob && (
              <div>
                <ToolResultPanel
                  blob={resultBlob}
                  filename={resultFilename}
                  title="Created PDF preview"
                  onProcessAnother={() => {
                    setResultBlob(null);
                    setResultFilename("");
                    setStage("create");
                    setProcessedFile(null);
                  }}
                />
              </div>
            )}
        </div>
      </div>
  );

  return (
    <ToolRouteShell
      slug="pdf-maker"
      toolName={contentData.hero.title}
      seoTitle={contentData.hero.title}
      seoDescription={contentData.hero.subtitle}
      onReset={resetWorkflow}
    >
      <ToolPageSplit
        desktop={
          <>
            <div className="hidden lg:block">
              <ToolSEO title={contentData.hero.title} description={contentData.hero.subtitle} slug="pdf-maker" lang={i18n.language} />
            </div>
            {editorBody}
          </>
        }
        mobile={
          <MobileToolLayout
            slug="pdf-maker"
            toolLabel={contentData.hero.title}
            title={contentData.hero.title}
            workflowStep={stage === "create" ? "configure" : stage === "processing" ? "process" : "done"}
            processButton={
              stage === "create" && content.trim() ? (
                <button type="button" onClick={handleCreatePDF} className={TOOL_PRIMARY_BTN}>
                  <FileText className="h-4 w-4" />
                  Create PDF
                </button>
              ) : null
            }
            postProcessPanel={
              resultBlob && stage === "done" ? (
                <MobilePostProcessPanel
                  currentSlug="pdf-maker"
                  onDownload={() => void safeDownloadBlob(resultBlob, resultFilename)}
                  onProcessAnother={resetWorkflow}
                />
              ) : undefined
            }
          >
            <ToolSEO title={contentData.hero.title} description={contentData.hero.subtitle} slug="pdf-maker" lang={i18n.language} />
            {editorBody}
          </MobileToolLayout>
        }
      />
    </ToolRouteShell>
  );
}