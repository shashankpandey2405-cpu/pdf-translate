"use client";

import type { ReactNode } from "react";
import { EnhancedFeatureComparison } from "@/components/tools/EnhancedFeatureComparison";
import { useHydrated } from "@/hooks/useHydrated";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { ProcessingModeScope } from "@/context/ProcessingModeContext";
import { isHybridTool } from "@/lib/processing/toolProfiles";
type Props = {
  toolSlug: string;
  children: ReactNode;
  showComparison?: boolean;
};

/** Dual-tier chrome wrapper: scopes mode per tool route. Mode hero lives in configure step. */
export function HybridToolChrome({ toolSlug, children, showComparison = true }: Props) {
  const hydrated = useHydrated();
  const { enabled } = useProcessingMode();
  const showChrome = hydrated && enabled && isHybridTool(toolSlug);

  if (!showChrome) {
    return <>{children}</>;
  }

  return (
    <ProcessingModeScope toolSlug={toolSlug}>
      <div className="space-y-8">
        {children}
        {showComparison ? <EnhancedFeatureComparison /> : null}
      </div>
    </ProcessingModeScope>
  );
}

/** @deprecated Use HybridToolChrome */
export function EnhancedToolChrome({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
