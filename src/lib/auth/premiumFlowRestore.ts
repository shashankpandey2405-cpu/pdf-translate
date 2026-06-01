import { createStore, del, get, set } from "idb-keyval";
import type { ProcessingMode } from "@/lib/enhanced/types";

const STORE = createStore("pdftrusted-premium-pending", "pending");
const PENDING_KEY = "flow";
const TTL_MS = 45 * 60 * 1000;

export const PREMIUM_FLOW_RESTORE_EVENT = "premium-flow-restore";

export type PremiumPendingFlow = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  toolSlug: string;
  mode: ProcessingMode;
  settings?: Record<string, unknown>;
  createdAt: number;
};

import type { SignInTone } from "@/lib/conversion/signInCopy";

export type PremiumAuthIntent = {
  returnPath?: string;
  desiredMode?: ProcessingMode;
  toolSlug?: string;
  autoStart?: boolean;
  deferredAction?: "reload" | "premium-restore" | "enhanced" | "upgrade";
  reason?: string;
  /** Modal headline variant for conversion-optimized copy */
  tone?: SignInTone;
};

export async function stashPremiumFlow(flow: Omit<PremiumPendingFlow, "createdAt">): Promise<boolean> {
  try {
    await set(
      PENDING_KEY,
      { ...flow, createdAt: Date.now() } satisfies PremiumPendingFlow,
      STORE,
    );
    return true;
  } catch {
    return false;
  }
}

export async function loadPremiumFlow(toolSlug?: string): Promise<PremiumPendingFlow | null> {
  try {
    const raw = (await get(PENDING_KEY, STORE)) as PremiumPendingFlow | undefined;
    if (!raw?.blob) return null;
    if (Date.now() - raw.createdAt > TTL_MS) {
      await clearPremiumFlow();
      return null;
    }
    if (toolSlug && raw.toolSlug !== toolSlug) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function clearPremiumFlow(): Promise<void> {
  try {
    await del(PENDING_KEY, STORE);
  } catch {
    /* ignore */
  }
}

export function premiumFlowToFile(flow: PremiumPendingFlow): File {
  return new File([flow.blob], flow.fileName, { type: flow.mimeType || flow.blob.type });
}

export type PremiumFlowRestoreDetail = PremiumPendingFlow & { autoStart?: boolean };

let restoreDispatchInFlight = false;

export function dispatchPremiumFlowRestore(
  detail: PremiumPendingFlow,
  opts?: { autoStart?: boolean },
): void {
  if (typeof window === "undefined") return;
  if (restoreDispatchInFlight) return;
  restoreDispatchInFlight = true;
  const payload: PremiumFlowRestoreDetail = { ...detail, autoStart: opts?.autoStart };
  window.dispatchEvent(new CustomEvent(PREMIUM_FLOW_RESTORE_EVENT, { detail: payload }));
  window.setTimeout(() => {
    restoreDispatchInFlight = false;
  }, 2500);
}
