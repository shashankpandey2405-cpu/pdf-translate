import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Download, Trash2, CheckCircle2, FileText, ArrowLeft, Shield, X } from "lucide-react";
import { useProcess } from "@/context/ProcessContext";
import { logToolSuccess, trackInteraction } from "@/utils/logger";
import { authOnlyProductMode, showAuthPremiumMarketingUi } from "@/lib/featureFlags";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DownloadPage() {
  const { processedFile, clearProcessedFile } = useProcess();
  const [, setLocation] = useLocation();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [isAdOverlayVisible, setIsAdOverlayVisible] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  useEffect(() => {
    document.title = "Download your PDF — PDFTrusted";
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        "content",
        "Secure browser-based PDF download page with ad-supported support from PDFTrusted."
      );
    }
  }, []);

  useEffect(() => {
    if (!processedFile) return;
    const url = URL.createObjectURL(processedFile.blob);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [processedFile]);

  if (!processedFile || deleted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {deleted ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">File Deleted</h2>
              <p className="text-sm text-muted-foreground mb-6">Your file has been removed from browser memory. No traces remain.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">No file ready</h2>
              <p className="text-sm text-muted-foreground mb-6">Process a PDF first to see your download here.</p>
            </>
          )}
          <button
            data-testid="button-go-home"
            onClick={() => {
              trackInteraction("download_page_go_home_click", { tool_slug: processedFile?.toolSlug ?? "" });
              setLocation("/");
            }}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to All Tools
          </button>
        </div>
      </div>
    );
  }

  const savings = processedFile.originalSize - processedFile.processedSize;
  const savingsPct = processedFile.originalSize > 0 ? Math.round((savings / processedFile.originalSize) * 100) : 0;

  function handleDownload() {
    if (!downloadUrl) return;
    trackInteraction("download_page_cta_click", { tool_slug: processedFile?.toolSlug ?? "" });
    setAdCountdown(5);
    setIsAdOverlayVisible(true);
  }

  useEffect(() => {
    if (!isAdOverlayVisible) return;
    if (adCountdown <= 0) return;

    const interval = window.setInterval(() => {
      setAdCountdown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isAdOverlayVisible, adCountdown]);

  useEffect(() => {
    if (!isAdOverlayVisible || adCountdown > 0) return;
    if (!downloadUrl || !processedFile) {
      setIsAdOverlayVisible(false);
      return;
    }

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = processedFile.filename;
    a.click();
    logToolSuccess(processedFile.toolSlug, {
      filename: processedFile.filename,
      flow: "download_page_auto",
    });
    setTimeout(() => setIsAdOverlayVisible(false), 200);
  }, [adCountdown, downloadUrl, isAdOverlayVisible, processedFile]);

  function handleDelete() {
    trackInteraction("download_page_delete_file", { tool_slug: processedFile?.toolSlug ?? "" });
    clearProcessedFile();
    setDeleted(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main download card */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-8"
          >
            {/* Success header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Your file is ready!</h1>
                <p className="text-sm text-muted-foreground">{processedFile.tool} completed successfully</p>
              </div>
            </div>

            {/* File info */}
            <div className="bg-muted/50 rounded-2xl p-4 mb-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{processedFile.filename}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(processedFile.processedSize)}</p>
              </div>
              {savingsPct > 0 && (
                <span className="flex-shrink-0 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  -{savingsPct}%
                </span>
              )}
            </div>

            {savingsPct > 0 && (
              <div className="mb-6 grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Original</p>
                  <p className="font-semibold text-sm">{formatBytes(processedFile.originalSize)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Saved</p>
                  <p className="font-semibold text-sm text-green-700">{formatBytes(Math.max(savings, 0))}</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">New size</p>
                  <p className="font-semibold text-sm text-primary">{formatBytes(processedFile.processedSize)}</p>
                </div>
              </div>
            )}

            {/* Download button */}
            <button
              data-testid="button-download-file"
              onClick={handleDownload}
              className="min-h-[52px] w-full flex items-center justify-center gap-3 px-6 py-5 bg-primary text-white text-lg font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 mb-4 touch-manipulation active:scale-[0.99]"
            >
              <Download className="w-5 h-5" />
              Download {processedFile.filename}
            </button>

            {/* Delete button */}
            <button
              data-testid="button-delete-file"
              onClick={handleDelete}
              className="min-h-[48px] w-full flex items-center justify-center gap-2 px-5 py-3.5 border border-border text-sm font-medium text-muted-foreground rounded-xl hover:bg-muted hover:text-destructive hover:border-destructive/30 transition-colors touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
              Delete file from browser memory
            </button>

            <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Normal-mode files stay in your browser. Premium cloud outputs are temporary and auto-deleted per our retention policy.
            </p>
          </motion.div>

        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {!authOnlyProductMode() && !showAuthPremiumMarketingUi() && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <Shield className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-bold text-lg text-foreground">Your file stays private</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Downloads are generated in your browser. Clear this file from memory when you are done, or run another tool — no account required.
              </p>
            </div>
          )}

          {/* Process another */}
          <button
            data-testid="button-process-another"
            onClick={() => setLocation(`/${processedFile.toolSlug}`)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border text-sm font-semibold rounded-xl hover:bg-muted transition-colors"
          >
            Process another file
          </button>
        </div>
      </div>

      {isAdOverlayVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-lg w-full rounded-3xl border border-white/10 bg-card p-8 shadow-2xl shadow-slate-950/40"
          >
            <button
              aria-label="Close ad overlay"
              onClick={() => setIsAdOverlayVisible(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <span className="text-xl font-bold">Ad</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">One moment while we prepare your download</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                This free PDF tool is supported by ads. Your download will begin automatically in a few seconds.
              </p>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-semibold">
                {adCountdown}
              </div>
              <div className="rounded-3xl bg-muted p-4 text-sm text-muted-foreground">
                Ad preview: Boosting the free PDF experience while keeping your documents private.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
