"use client";

import { useEffect, useRef, useState } from "react";
import type { EnhancedJobResponse } from "@/lib/enhanced/types";

/** Eight milestones — one per CloudProcessingExperience step. */
const MILESTONES = [5, 14, 28, 42, 56, 70, 86, 100] as const;

const MIN_DISPLAY_MS = 14_000;
const TICK_MS = 450;

function milestoneForValue(value: number): (typeof MILESTONES)[number] {
  let chosen: (typeof MILESTONES)[number] = MILESTONES[0];
  for (const m of MILESTONES) {
    if (value >= m) chosen = m;
    else break;
  }
  return chosen;
}

type Args = {
  backendProgress: number;
  cloudStatus: EnhancedJobResponse["status"] | "idle" | "downloading";
  active: boolean;
};

function computeDisplay(
  backendProgress: number,
  cloudStatus: Args["cloudStatus"],
  startedAt: number,
  maxSeen: number,
): { next: number; idx: number } {
  const backendFloor =
    cloudStatus === "done" || cloudStatus === "downloading"
      ? 100
      : cloudStatus === "processing"
        ? Math.max(38, backendProgress)
        : cloudStatus === "queued"
          ? Math.max(18, backendProgress)
          : backendProgress;

  const elapsed = Date.now() - startedAt;
  const timeCurve = Math.min(96, 5 + Math.floor((elapsed / MIN_DISPLAY_MS) * 91));

  const candidate = Math.max(backendFloor, timeCurve);
  const next = Math.max(maxSeen, milestoneForValue(candidate));
  const idx = MILESTONES.findIndex((m) => m >= next);
  return { next, idx: idx === -1 ? MILESTONES.length - 1 : idx };
}

/**
 * Blends backend poll progress with timed milestones for a premium perceived flow.
 * Ticks on an interval so the bar keeps moving during long docx/office jobs.
 */
export function usePerceivedCloudProgress({ backendProgress, cloudStatus, active }: Args) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const startedAt = useRef<number | null>(null);
  const maxSeen = useRef(0);

  useEffect(() => {
    if (!active) {
      startedAt.current = null;
      maxSeen.current = 0;
      setDisplayProgress(0);
      setStepIndex(0);
      return;
    }
    if (startedAt.current === null) startedAt.current = Date.now();

    const apply = () => {
      const { next, idx } = computeDisplay(
        backendProgress,
        cloudStatus,
        startedAt.current ?? Date.now(),
        maxSeen.current,
      );
      maxSeen.current = next;
      setDisplayProgress(next);
      setStepIndex(idx);
    };

    apply();
    const id = window.setInterval(apply, TICK_MS);
    return () => window.clearInterval(id);
  }, [active, backendProgress, cloudStatus]);

  useEffect(() => {
    if (!active || (cloudStatus !== "done" && cloudStatus !== "downloading")) return;
    maxSeen.current = 100;
    setDisplayProgress(100);
    setStepIndex(MILESTONES.length - 1);
  }, [active, cloudStatus]);

  return { displayProgress, stepIndex };
}
