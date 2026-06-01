"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProcessingMode } from "@/lib/enhanced/types";
import {
  clearHybridUploadSession,
  hybridSessionToFile,
  loadHybridUploadSession,
  newUploadSessionId,
  saveHybridUploadSession,
} from "@/lib/processing/hybridUploadSession";
import { stashPremiumFlow } from "@/lib/auth/premiumFlowRestore";
import { SIGN_IN_REASON } from "@/lib/conversion/signInCopy";
import { useProcessingMode } from "@/context/ProcessingModeContext";
import { usePremium } from "@/context/PremiumContext";
import { useAuthPrompt, stashAuthIntent } from "@/context/AuthPromptContext";

type Options = {
  toolSlug: string;
  settings?: Record<string, unknown>;
  onRestore?: (file: File) => void | Promise<void>;
};

/**
 * Single upload session per hybrid tool — file survives login, limit modals, and mode picks.
 */
export function useHybridToolWorkflow({ toolSlug, settings, onRestore }: Options) {
  const [file, setFile] = useState<File | null>(null);
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { setMode } = useProcessingMode();
  const { isSignedIn } = usePremium();
  const { requestSignIn } = useAuthPrompt();
  const restoredRef = useRef(false);

  const persistFile = useCallback(
    async (f: File, preferredMode?: ProcessingMode) => {
      const sid = sessionId ?? newUploadSessionId();
      setSessionId(sid);
      await saveHybridUploadSession({
        sessionId: sid,
        toolSlug,
        fileName: f.name,
        mimeType: f.type,
        blob: f,
        settings,
        preferredMode,
      });
    },
    [sessionId, toolSlug, settings],
  );

  const acceptUpload = useCallback(
    async (f: File, opts?: { openModeModal?: boolean }) => {
      setFile(f);
      await persistFile(f);
      setModeModalOpen(opts?.openModeModal ?? false);
    },
    [persistFile],
  );

  const clearSession = useCallback(async () => {
    setFile(null);
    setSessionId(null);
    setModeModalOpen(false);
    await clearHybridUploadSession(toolSlug);
  }, [toolSlug]);

  const preparePremiumContinuation = useCallback(
    async (f: File, autoStart: boolean) => {
      await stashPremiumFlow({
        blob: f,
        fileName: f.name,
        mimeType: f.type,
        toolSlug,
        mode: "enhanced",
        settings,
      });
      const returnPath =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      stashAuthIntent({
        returnPath,
        desiredMode: "enhanced",
        toolSlug,
        autoStart,
        deferredAction: "premium-restore",
        reason: SIGN_IN_REASON.cloudWithUpload,
        tone: "cloud",
      });
    },
    [toolSlug, settings],
  );

  const continueWithPremium = useCallback(
    async (opts?: { autoStart?: boolean }) => {
      if (!file) return;
      setMode("enhanced");
      setModeModalOpen(false);
      if (!isSignedIn) {
        await preparePremiumContinuation(file, opts?.autoStart ?? true);
        requestSignIn({
          reason: SIGN_IN_REASON.cloudWithUpload,
          tone: "cloud",
          deferredAction: "premium-restore",
          toolSlug,
          autoStart: opts?.autoStart ?? true,
        });
        return;
      }
      if (opts?.autoStart) {
        return;
      }
    },
    [file, isSignedIn, preparePremiumContinuation, requestSignIn, setMode, toolSlug],
  );

  const continueWithNormal = useCallback(() => {
    setMode("browser");
    setModeModalOpen(false);
  }, [setMode]);

  useEffect(() => {
    if (restoredRef.current) return;
    void (async () => {
      const session = await loadHybridUploadSession(toolSlug);
      if (!session) return;
      restoredRef.current = true;
      const restored = hybridSessionToFile(session);
      setFile(restored);
      setSessionId(session.sessionId);
      setModeModalOpen(false);
      if (session.preferredMode) setMode(session.preferredMode);
      await onRestore?.(restored);
    })();
  }, [toolSlug, setMode, onRestore]);

  return {
    file,
    setFile,
    modeModalOpen,
    setModeModalOpen,
    sessionId,
    acceptUpload,
    clearSession,
    persistFile,
    continueWithPremium,
    continueWithNormal,
  };
}
