import { createStore, del, get, set } from "idb-keyval";
import type { ProcessingMode } from "@/lib/enhanced/types";

const STORE = createStore("pdftrusted-hybrid-upload", "sessions");
const TTL_MS = 45 * 60 * 1000;

export type HybridUploadSession = {
  sessionId: string;
  toolSlug: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  settings?: Record<string, unknown>;
  preferredMode?: ProcessingMode;
  createdAt: number;
};

function sessionKey(toolSlug: string): string {
  return `upload:${toolSlug}`;
}

export function newUploadSessionId(): string {
  return `up_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Persist uploaded file so login / mode switches never lose it. */
export async function saveHybridUploadSession(
  session: Omit<HybridUploadSession, "createdAt">,
): Promise<boolean> {
  try {
    const payload: HybridUploadSession = { ...session, createdAt: Date.now() };
    await set(sessionKey(session.toolSlug), payload, STORE);
    try {
      sessionStorage.setItem(
        `pdftrusted-upload-meta:${session.toolSlug}`,
        JSON.stringify({
          sessionId: session.sessionId,
          fileName: session.fileName,
          createdAt: payload.createdAt,
        }),
      );
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

export async function loadHybridUploadSession(toolSlug: string): Promise<HybridUploadSession | null> {
  try {
    const raw = (await get(sessionKey(toolSlug), STORE)) as HybridUploadSession | undefined;
    if (!raw?.blob) return null;
    if (Date.now() - raw.createdAt > TTL_MS) {
      await clearHybridUploadSession(toolSlug);
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export async function clearHybridUploadSession(toolSlug: string): Promise<void> {
  try {
    await del(sessionKey(toolSlug), STORE);
    sessionStorage.removeItem(`pdftrusted-upload-meta:${toolSlug}`);
  } catch {
    /* ignore */
  }
}

export function hybridSessionToFile(session: HybridUploadSession): File {
  return new File([session.blob], session.fileName, {
    type: session.mimeType || session.blob.type || "application/octet-stream",
  });
}
