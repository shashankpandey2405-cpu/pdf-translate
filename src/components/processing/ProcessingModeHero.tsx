"use client";

import { ExecutionModeSelector } from "@/components/processing/ExecutionModeSelector";

type Props = {
  toolSlug: string;
  file?: File | null;
  settings?: Record<string, unknown>;
  className?: string;
  onCancel: () => void;
  onRunPremium?: () => void | Promise<void>;
  onRunNormal?: () => void | Promise<void>;
};

/** Dual execution cards: Browser (free) vs Cloud (premium). */
export function ProcessingModeHero(props: Props) {
  return <ExecutionModeSelector {...props} showCancel />;
}
