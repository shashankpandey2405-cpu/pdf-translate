"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, ImageIcon } from "lucide-react";
import DropZone from "@/components/DropZone";
import ToolSEO from "@/components/ToolSEO";
import { StudentToolBadge } from "@/components/student/StudentToolBadge";
import { TrustShieldPrivacyNotice } from "@/components/trustShield/TrustShieldPrivacyNotice";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { MobilePostProcessPanel } from "@/components/mobile/MobilePostProcessPanel";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { ToolUploadSlot } from "@/components/tools/ux/ToolUploadSlot";
import { ToolRenderErrorBoundary } from "@/components/desktop/ToolRenderErrorBoundary";
import { TOOL_PRIMARY_BTN } from "@/components/tools/ux/toolUxClasses";
import { resizeToTargetKb } from "@/tools/student/photoResizer";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { useTranslation } from "react-i18next";

const PRESETS = [20, 50, 100, 200, 500];

function TargetKbSettings({
  targetKb,
  setTargetKb,
}: {
  targetKb: number;
  setTargetKb: (n: number) => void;
}) {
  return (
    <div>
      <label htmlFor="target-kb-input" className="block text-sm font-semibold text-foreground">
        Target size (KB)
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((kb) => (
          <button
            key={kb}
            type="button"
            onClick={() => setTargetKb(kb)}
            className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold touch-manipulation ${targetKb === kb ? "border-primary bg-primary text-white" : "border-border bg-card"}`}
          >
            {kb} KB
          </button>
        ))}
      </div>
      <input
        id="target-kb-input"
        type="number"
        inputMode="numeric"
        min={5}
        max={5000}
        value={targetKb}
        onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value) || 100))}
        className="mt-3 min-h-11 w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-semibold"
      />
    </div>
  );
}

export default function PhotoResizer() {
  const { i18n } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetKb, setTargetKb] = useState(100);
  const [result, setResult] = useState<{ blob: Blob; sizeKb: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return URL.createObjectURL(f);
    });
  }, []);

  async function compress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await resizeToTargetKb(file, targetKb);
      setResult({ blob, sizeKb: Math.round(blob.size / 1024) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resize failed");
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!result) return;
    const ext = file?.name.match(/\.(\w+)$/)?.[1] || "jpg";
    await safeDownloadBlob(result.blob, `resized-${targetKb}kb.${ext}`);
  }

  const workflowBody = (
    <div className="space-y-6">
      {!file ? (
        <ToolUploadSlot
          files={[]}
          onFiles={handleFiles}
          accept="image/jpeg,image/png,image/webp,image/*"
          label="Upload your photo"
          sublabel="We'll compress to your target KB in-browser"
        />
      ) : (
        <>
          {previewUrl && (
            <div className="flex justify-center rounded-2xl border border-border bg-card p-4">
              <img src={previewUrl} alt="" className="max-h-48 rounded-xl object-contain" />
            </div>
          )}
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            Original: {(file.size / 1024).toFixed(1)} KB
          </p>
          <div className="hidden lg:block">
            <TargetKbSettings targetKb={targetKb} setTargetKb={setTargetKb} />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void compress()}
            className="hidden w-full min-h-12 rounded-2xl bg-primary py-4 text-base font-bold text-white shadow-lg disabled:opacity-50 lg:flex"
          >
            {busy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Compressing…
              </span>
            ) : (
              `Resize to ${targetKb} KB`
            )}
          </button>
          {result && (
            <div className="hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 lg:block">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Done — output is {result.sizeKb} KB
              </p>
              <button
                type="button"
                onClick={() => void download()}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
              >
                <Download className="h-4 w-4" /> Download image
              </button>
            </div>
          )}
          <button type="button" onClick={reset} className="hidden text-sm text-muted-foreground lg:inline">
            Choose another photo
          </button>
        </>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );

  const desktop = (
    <div className="min-h-[calc(100dvh-4rem)] bg-muted/30">
      <ToolSEO
        title="Photo Resizer for Forms"
        description="Resize passport photos and form uploads to an exact KB size. Private, fast, and built for students."
        slug="photo-resizer"
        lang={i18n.language}
      />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <StudentToolBadge />
        <h1 className="mt-4 text-3xl font-bold text-foreground">Photo Resizer for Forms</h1>
        <p className="mt-2 text-muted-foreground">
          Hit the exact file size required by university portals, visa forms, and job applications — without losing clarity.
        </p>
        <div className="mt-8">{workflowBody}</div>
        <div className="mt-10 border-t border-border/40 pt-4">
          <TrustShieldPrivacyNotice />
        </div>
      </div>
    </div>
  );

  const mobile = (
    <MobileToolLayout
      slug="photo-resizer"
      toolLabel="Photo Resizer"
      title="Photo Resizer"
      workflowStep={result ? "done" : file ? "configure" : "upload"}
      settingsPanel={file ? <TargetKbSettings targetKb={targetKb} setTargetKb={setTargetKb} /> : undefined}
      processButton={
        file && !result ? (
          <button type="button" disabled={busy} onClick={() => void compress()} className={TOOL_PRIMARY_BTN}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Compressing…
              </span>
            ) : (
              `Resize to ${targetKb} KB`
            )}
          </button>
        ) : null
      }
      postProcessPanel={
        result ? (
          <MobilePostProcessPanel
            currentSlug="photo-resizer"
            onDownload={() => void download()}
            onProcessAnother={reset}
            downloadLabel={`Download (${result.sizeKb} KB)`}
          />
        ) : undefined
      }
    >
      <StudentToolBadge />
      {workflowBody}
    </MobileToolLayout>
  );

  return (
    <ToolRenderErrorBoundary onReset={reset}>
      <ToolPageSplit desktop={desktop} mobile={mobile} />
    </ToolRenderErrorBoundary>
  );
}
