"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { ArrowLeft, Download, Loader2, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeStudioBadge } from "@/components/resume/ResumeStudioBadge";
import { ResumeSectionNav } from "./ResumeSectionNav";
import { ResumeSectionPanel } from "./ResumeSectionPanel";
import { ResumeDesignBar } from "./ResumeDesignBar";
import { MobileResumeToolbar, type MobilePane } from "./MobileResumeToolbar";
import { exportResumeElementToPdf } from "@/tools/resume/exportPdf";
import { saveResume } from "@/tools/resume/storage";
import { getTemplateMeta } from "@/tools/resume/templates";
import type { ResumeData, ResumeSectionId } from "@/tools/resume/types";

type Props = {
  data: ResumeData;
  onPatch: (fn: (d: ResumeData) => ResumeData) => void;
  onBackToTemplates: () => void;
};

export function ResumeStudioShell({ data, onPatch, onBackToTemplates }: Props) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<ResumeSectionId>("header");
  const [zoom, setZoom] = useState(0.85);
  const [exporting, setExporting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("form");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let hideTimer: number | undefined;
    const saveTimer = window.setTimeout(() => {
      saveResume(data);
      setSavedFlash(true);
      hideTimer = window.setTimeout(() => setSavedFlash(false), 1500);
    }, 400);
    return () => {
      window.clearTimeout(saveTimer);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, [data]);

  const exportPdf = useCallback(async () => {
    const wrap = previewRef.current?.querySelector("[data-resume-scale-wrap]") as HTMLElement | null;
    const el = previewRef.current?.querySelector("#resume-preview-export") as HTMLElement | null;
    if (!el) return;
    const prevClass = wrap?.className ?? "";
    if (wrap) wrap.className = "origin-top scale-100";
    setExporting(true);
    try {
      const name = data.personal.fullName.trim() || "resume";
      const blob = await exportResumeElementToPdf(el);
      await safeDownloadBlob(blob, `${name.replace(/\s+/g, "_")}_Resume.pdf`);
    } finally {
      if (wrap) wrap.className = prevClass;
      setExporting(false);
    }
  }, [data.personal.fullName]);

  const tmplMeta = getTemplateMeta(data.templateId);
  const tmplLabel = tmplMeta ? t(tmplMeta.labelKey) : data.templateId;

  const handlePreviewSectionClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest("[data-section-id]");
    if (target instanceof HTMLElement && target.dataset.sectionId) {
      setActiveSection(target.dataset.sectionId as ResumeSectionId);
      setMobilePane("form");
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-muted/20 flex flex-col pb-20 lg:pb-0 animate-in fade-in duration-300">
      <div className="border-b border-border bg-card/95 backdrop-blur-md px-4 py-3 shrink-0 z-10">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <button type="button" onClick={onBackToTemplates} className="mt-1 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label={t("resumeStudio.changeTemplate")}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <ResumeStudioBadge />
              <h1 className="mt-1 text-lg sm:text-xl font-bold">{t("resumeStudio.title")}</h1>
              <p className="text-xs text-muted-foreground">
                {tmplLabel} · {t("resumeStudio.autoSaved")}
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {savedFlash && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <Save className="h-3 w-3" /> {t("resumeStudio.saved")}
              </span>
            )}
            <button type="button" disabled={exporting} onClick={() => void exportPdf()} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t("resumeStudio.download")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full max-w-[1680px] mx-auto">
        <div
          className={`lg:w-[min(200px,18%)] shrink-0 border-b lg:border-b-0 lg:border-r border-border p-3 overflow-y-auto ${
            mobilePane === "form" ? "block" : "hidden lg:block"
          }`}
        >
          <ResumeSectionNav data={data} activeSection={activeSection} onActive={setActiveSection} onPatch={onPatch} />
        </div>

        <div
          className={`lg:w-[min(400px,36%)] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card/60 overflow-y-auto p-4 space-y-4 pb-[max(1rem,var(--keyboard-inset,0px))] ${
            mobilePane === "form" ? "block" : "hidden lg:block"
          } lg:max-h-[calc(100dvh-7.5rem)]`}
        >
          <ResumeDesignBar data={data} zoom={zoom} onZoom={setZoom} onPatch={onPatch} />
          <ResumeSectionPanel data={data} section={activeSection} onPatch={onPatch} />
        </div>

        <div
          className={`flex-1 lg:sticky lg:top-0 lg:self-start lg:h-[calc(100dvh-7.5rem)] overflow-y-auto bg-slate-300/40 dark:bg-slate-950/50 p-4 ${
            mobilePane === "preview" ? "block" : "hidden lg:block"
          }`}
          onClick={handlePreviewSectionClick}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center lg:text-left">
            {t("resumeStudio.livePreview")}
          </p>
          <div ref={previewRef} className="flex justify-center pb-8 w-full min-h-[480px]">
            <div
              data-resume-scale-wrap
              className="origin-top w-full max-w-[816px] mx-auto transition-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              <ResumePreview data={data} />
            </div>
          </div>
        </div>
      </div>

      <MobileResumeToolbar pane={mobilePane} onPane={setMobilePane} onDownload={() => void exportPdf()} exporting={exporting} />
    </div>
  );
}
