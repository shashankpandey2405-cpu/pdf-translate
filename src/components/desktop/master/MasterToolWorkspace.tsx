"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Trash2 } from "lucide-react";
import DropZone from "@/components/DropZone";
import { DesktopMiniSidebar } from "@/components/desktop/DesktopMiniSidebar";
import { DesktopRightRailGear } from "@/components/desktop/DesktopRightRailGear";
import { GlassPanel } from "@/components/desktop/GlassPanel";
import { ProcessingPipeline } from "@/components/desktop/ProcessingPipeline";
import { ToolInputPreview } from "@/components/tools/ToolInputPreview";
import { formatPreviewBytes } from "@/components/tools/filePreviewUtils";
import { ToolRightRailProvider, useToolRightRail } from "@/context/ToolRightRailContext";
import { getToolDesktopMeta } from "@/lib/desktop/toolMeta";
import { pipelineFromProgress } from "@/lib/desktop/pipelineFromProgress";
import type { MasterToolStage } from "@/lib/desktop/types";
import { shouldShowDesktopRightPanel } from "@/lib/desktop/toolMeta";
import { cn } from "@/lib/utils";

export type MasterToolWorkspaceProps = {
  toolSlug: string;
  stage: MasterToolStage;
  activeSlug?: string;
  file: File | null;
  files?: File[];
  onFiles: (files: File[]) => void | Promise<void>;
  onReset: () => void;
  progress?: number;
  multiple?: boolean;
  accept?: string;
  /** Center workspace below file meta (configure preview, custom UI) */
  configureContent?: ReactNode;
  /** Optional center content during processing (defaults to before/after pipeline) */
  processingContent?: ReactNode;
  /** Done state center (before/after); if omitted, shows default comparison when resultBlob set */
  resultBlob?: Blob | null;
  resultFilename?: string;
  objectUrl?: string | null;
  resultPreview?: ReactNode;
  /** Right rail — actions, options, done panel */
  rightPanel: ReactNode;
  headerExtra?: ReactNode;
  /** Hide duplicate filename bar when center preview card shows it */
  hideFileMetaBar?: boolean;
};

function MasterToolWorkspaceInner({
  toolSlug,
  stage,
  activeSlug,
  file,
  files,
  onFiles,
  onReset,
  progress = 0,
  multiple = false,
  accept,
  configureContent,
  processingContent,
  resultBlob,
  resultFilename = "output",
  objectUrl,
  resultPreview,
  rightPanel,
  headerExtra,
  hideFileMetaBar = false,
}: MasterToolWorkspaceProps) {
  const meta = getToolDesktopMeta(toolSlug);
  const slug = activeSlug ?? toolSlug;
  const primaryFile = file ?? files?.[0] ?? null;
  const hasFile = Boolean(primaryFile) || (files?.length ?? 0) > 0;
  const canShowRail = shouldShowDesktopRightPanel(stage, hasFile);
  const { isOpen, openRail, clearValidation } = useToolRightRail();
  const showRight = canShowRail && isOpen;

  useEffect(() => {
    if (!hasFile || stage === "upload") return;
    if (stage === "configure" || stage === "done") {
      openRail({ force: true });
    }
  }, [hasFile, stage, openRail]);

  useEffect(() => {
    if (stage === "upload") clearValidation();
  }, [stage, clearValidation]);

  const pipelineSteps = useMemo(
    () => pipelineFromProgress(meta.pipelineSteps, progress),
    [meta.pipelineSteps, progress],
  );

  const savedPct =
    primaryFile &&
    resultBlob &&
    (resultFilename.toLowerCase().endsWith(".pdf") || resultBlob.type === "application/pdf")
      ? Math.max(0, Math.round((1 - resultBlob.size / primaryFile.size) * 100))
      : null;

  const isConversionOutput =
    resultBlob &&
    (resultFilename.toLowerCase().endsWith(".docx") ||
      resultFilename.toLowerCase().endsWith(".xlsx") ||
      resultFilename.toLowerCase().endsWith(".pptx"));

  const uploadOnly = stage === "upload" && !hasFile;

  return (
    <div className="master-tool-workspace hidden h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-[hsl(210_20%_98%)] lg:flex">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DesktopMiniSidebar activeSlug={slug} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <motion.main
            layout
            className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 xl:px-7 xl:py-5"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <header
              className={cn(
                "flex shrink-0 items-start justify-between gap-4",
                uploadOnly ? "mb-3" : "mb-4",
              )}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {meta.categoryLabel}
                </p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground xl:text-[1.65rem]">
                  {meta.title}
                </h1>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{meta.subtitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canShowRail ? <DesktopRightRailGear showBadge={!isOpen && hasFile} /> : null}
                {hasFile ? (
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-white/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Start over
                  </button>
                ) : (
                  headerExtra
                )}
              </div>
            </header>

            <AnimatePresence mode="wait">
              {stage === "upload" && !hasFile ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex min-h-0 flex-1 items-center justify-center"
                >
                  <div className="w-full max-w-xl">
                    <DropZone
                      onFiles={onFiles}
                      multiple={multiple}
                      accept={accept ?? meta.accept}
                      label={meta.uploadLabel}
                      sublabel={meta.uploadSublabel}
                      className="min-h-[min(280px,42vh)] border-2 border-dashed border-primary/25 bg-white/90 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.12)] transition-shadow hover:shadow-[0_20px_56px_-26px_rgba(220,38,38,0.16)]"
                    />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Supported: {(accept ?? meta.accept).split(",").slice(0, 3).join(", ")}
                    </p>
                  </div>
                </motion.div>
              ) : null}

              {hasFile && stage !== "upload" ? (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex min-h-0 flex-1 flex-col gap-6"
                >
                  {primaryFile && !hideFileMetaBar ? (
                    <GlassPanel variant="elevated" className="flex flex-wrap items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <span className="text-lg font-bold">PDF</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold text-foreground">{primaryFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPreviewBytes(primaryFile.size)}
                          {files && files.length > 1 ? ` · ${files.length} files` : null}
                          {savedPct != null ? (
                            <span className="ml-2 font-semibold text-emerald-600">−{savedPct}%</span>
                          ) : null}
                        </p>
                      </div>
                    </GlassPanel>
                  ) : null}

                  {stage === "configure" ? (
                    configureContent ?? (
                      primaryFile ? (
                        <GlassPanel className="flex-1 p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Preview
                          </p>
                          <ToolInputPreview file={primaryFile} label="Your file" className="min-h-[400px]" />
                        </GlassPanel>
                      ) : null
                    )
                  ) : null}

                  {stage === "processing"
                    ? processingContent ??
                      (primaryFile ? (
                        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_auto_1fr]">
                          <GlassPanel className="flex flex-col p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Original
                            </p>
                            <ToolInputPreview file={primaryFile} label="Original" compact className="min-h-[280px] flex-1" />
                          </GlassPanel>
                          <div className="flex flex-col items-center justify-center gap-4 px-2">
                            <motion.div
                              animate={{ x: [0, 6, 0] }}
                              transition={{ repeat: Infinity, duration: 1.6 }}
                              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"
                            >
                              <ArrowRight className="h-6 w-6" />
                            </motion.div>
                            <ProcessingPipeline steps={pipelineSteps} className="w-[200px]" />
                          </div>
                          <GlassPanel className="flex flex-col items-center justify-center p-8">
                            <div className="h-12 w-12 animate-pulse rounded-full bg-primary/20" />
                            <p className="mt-4 text-sm font-medium text-muted-foreground">Building preview…</p>
                          </GlassPanel>
                        </div>
                      ) : null)
                    : null}

                  {stage === "done" && primaryFile
                    ? resultPreview ??
                      (resultBlob ? (
                        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                          <GlassPanel className="flex min-h-0 flex-col overflow-hidden p-3">
                            <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Before
                            </p>
                            <div className="min-h-0 flex-1 overflow-hidden">
                              <ToolInputPreview
                                file={primaryFile}
                                label="Original"
                                fullPage
                                previewLayout="paged"
                                className="h-[min(52vh,520px)] min-h-[280px] w-full max-w-none"
                              />
                            </div>
                            <p className="mt-2 shrink-0 text-center text-xs text-muted-foreground">
                              {formatPreviewBytes(primaryFile.size)}
                            </p>
                          </GlassPanel>
                          <div className="flex items-center justify-center py-2 lg:py-0">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg lg:h-14 lg:w-14">
                              <ArrowRight className="h-6 w-6 lg:h-7 lg:w-7" />
                            </span>
                          </div>
                          <GlassPanel className="flex min-h-0 flex-col overflow-hidden p-3 ring-2 ring-emerald-500/20">
                            <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                              After
                            </p>
                            <div className="min-h-0 flex-1 overflow-hidden">
                              <ToolInputPreview
                                file={
                                  new File([resultBlob], resultFilename, {
                                    type: resultBlob.type || "application/pdf",
                                  })
                                }
                                label="Result"
                                fullPage
                                previewLayout="paged"
                                className="h-[min(52vh,520px)] min-h-[280px] w-full max-w-none"
                              />
                            </div>
                            <p className="mt-2 shrink-0 text-center text-xs font-semibold text-emerald-700">
                              {formatPreviewBytes(resultBlob.size)}
                              {savedPct != null && savedPct > 0
                                ? ` (−${savedPct}%)`
                                : isConversionOutput
                                  ? " (converted)"
                                  : savedPct === 0
                                    ? " (no size change)"
                                    : ""}
                            </p>
                          </GlassPanel>
                        </div>
                      ) : null)
                    : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.main>
        </div>

        <AnimatePresence>
          {showRight ? (
            <motion.aside
              key="right-rail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "min(28%, 400px)", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "master-tool-right-rail hidden h-full min-w-[280px] max-w-[400px] shrink-0 border-l border-border/80",
                "bg-gradient-to-b from-white/95 to-slate-50/90 backdrop-blur-xl lg:block",
              )}
            >
              <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain p-4">
                {rightPanel}
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
        {canShowRail && !isOpen ? (
          <div className="hidden border-l border-dashed border-border/50 bg-muted/20 lg:flex lg:w-10 lg:shrink-0 lg:items-start lg:justify-center lg:pt-6">
            <DesktopRightRailGear showBadge />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MasterToolWorkspace(props: MasterToolWorkspaceProps) {
  return (
    <ToolRightRailProvider>
      <MasterToolWorkspaceInner {...props} />
    </ToolRightRailProvider>
  );
}
