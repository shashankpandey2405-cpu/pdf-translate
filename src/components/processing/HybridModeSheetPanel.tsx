"use client";

import type { ReactNode } from "react";
import { toolShowsPremiumChoiceModal } from "@/lib/processing/premiumTier";
import type { PremiumProcessingTier } from "@/lib/processing/premiumTier";
import { PremiumTierChoicePanel } from "@/components/processing/PremiumTierChoicePanel";
import { ExecutionModeSelector } from "@/components/processing/ExecutionModeSelector";

type Props = {
  toolSlug: string;
  file: File | null;
  browserDisabledReason?: string | null;
  settingsPanel?: ReactNode;
  /** Selection in gear; process via sticky CTA. */
  pickOnly?: boolean;
  onTierSelect?: (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => void;
  onTierChoose?: (tier: PremiumProcessingTier, mode: "browser" | "enhanced") => void | Promise<void>;
  onRunPremium?: () => void | Promise<void>;
  onRunNormal?: () => void | Promise<void>;
  settings?: Record<string, unknown>;
};

/** Inline mode + options for mobile gear sheet (no dialog). */
export function HybridModeSheetPanel({
  toolSlug,
  file,
  browserDisabledReason = null,
  settingsPanel,
  pickOnly = true,
  onTierSelect,
  onTierChoose,
  onRunPremium,
  onRunNormal,
  settings,
}: Props) {
  const useTierPanel = toolShowsPremiumChoiceModal(toolSlug) && Boolean(onTierSelect || onTierChoose);

  if (useTierPanel) {
    return (
      <PremiumTierChoicePanel
        toolSlug={toolSlug}
        file={file}
        compact
        pickOnly={pickOnly}
        browserDisabledReason={browserDisabledReason}
        settingsPanel={settingsPanel}
        onSelect={onTierSelect}
        onChoose={onTierChoose ?? onTierSelect ?? (() => {})}
        showHeading={!settingsPanel}
      />
    );
  }

  return (
    <div className="space-y-4">
      {settingsPanel}
      <ExecutionModeSelector
        toolSlug={toolSlug}
        file={file}
        settings={settings}
        variant="sidebar"
        showCancel={false}
        pickOnly={pickOnly}
        browserDisabledReason={browserDisabledReason}
        onRunPremium={onRunPremium}
        onRunNormal={onRunNormal}
      />
    </div>
  );
}
