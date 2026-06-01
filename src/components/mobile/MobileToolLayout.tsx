"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Settings2 } from "lucide-react";
import { MobileToolOptionsSheet } from "./MobileToolOptionsSheet";
import { ToolWorkflowStepBar, type ToolWorkflowStepId } from "@/components/tools/ux/ToolWorkflowStepBar";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  toolLabel: string;
  title: string;
  children: ReactNode;
  /** Rendered inside the right slide-in settings sheet (before processing). */
  settingsPanel?: ReactNode;
  /** Replaces settingsPanel content after processing completes. */
  postProcessPanel?: ReactNode;
  /** Sticky bottom CTA. Pass null to hide. */
  processButton?: ReactNode;
  /** Auto-open settings panel (e.g. when required fields are missing). */
  autoOpenSettings?: boolean;
  /** Callback when settings panel open state changes. */
  onSettingsOpen?: (open: boolean) => void;
  /** Extra class on the root element. */
  className?: string;
  /** Optional flow indicator (upload → options → process → download). */
  workflowStep?: ToolWorkflowStepId;
  hideConfigureStep?: boolean;
};

export function MobileToolLayout({
  slug,
  toolLabel,
  title,
  children,
  settingsPanel,
  postProcessPanel,
  processButton,
  autoOpenSettings,
  onSettingsOpen,
  className,
  workflowStep,
  hideConfigureStep,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [optionsPulse, setOptionsPulse] = useState(false);
  const sheetContent = postProcessPanel ?? settingsPanel;
  const autoOpenOnConfigure = workflowStep === "configure" && Boolean(settingsPanel) && !postProcessPanel;
  const shouldAutoOpen = Boolean(sheetContent) && (autoOpenSettings || autoOpenOnConfigure);

  useEffect(() => {
    if (!shouldAutoOpen) return;
    setSettingsOpen(true);
    setOptionsPulse(true);
    const t = window.setTimeout(() => setOptionsPulse(false), 1200);
    return () => window.clearTimeout(t);
  }, [shouldAutoOpen, workflowStep]);

  const handleSettingsChange = (open: boolean) => {
    setSettingsOpen(open);
    onSettingsOpen?.(open);
  };
  const showGear = Boolean(sheetContent);

  return (
    <div
      className={cn(
        "flex min-h-[calc(100dvh-3rem-4rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col lg:hidden",
        className,
      )}
    >
      {/* Header: tool name + gear icon */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h1 className="truncate text-lg font-extrabold tracking-tight text-foreground sm:text-xl">{title}</h1>
        {showGear && (
          <button
            type="button"
            onClick={() => handleSettingsChange(!settingsOpen)}
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm transition-colors active:bg-muted",
              optionsPulse && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
            )}
            aria-label="Tool settings"
            aria-expanded={settingsOpen}
          >
            <Settings2 className="h-[18px] w-[18px] text-primary" />
            {optionsPulse ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
            ) : null}
          </button>
        )}
      </div>

      {/* Scrollable center area */}
      <div className="flex min-w-0 flex-1 flex-col px-4 pb-2">
        {workflowStep ? (
          <ToolWorkflowStepBar active={workflowStep} hideConfigure={hideConfigureStep} className="mb-3 shrink-0" />
        ) : null}
        {children}
      </div>

      {/* Sticky process button above bottom nav */}
      {processButton && (
        <div className="sticky bottom-0 z-[35] border-t border-border/60 bg-background/95 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          {processButton}
        </div>
      )}

      {/* Right slide-in sheet */}
      {showGear && (
        <MobileToolOptionsSheet
          open={settingsOpen}
          onOpenChange={handleSettingsChange}
          title={postProcessPanel ? "What's Next?" : toolLabel}
          preventScrollLock
        >
          {sheetContent}
        </MobileToolOptionsSheet>
      )}
    </div>
  );
}
