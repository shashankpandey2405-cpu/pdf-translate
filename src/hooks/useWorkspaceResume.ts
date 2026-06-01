import { useEffect, useRef } from "react";
import { deferredReplaceState } from "@/lib/deferredHistory";

type Options = {
  toolSlug: string;
  enabled?: boolean;
  onResume: (file: File) => void;
};

/**
 * Loads a workspace entry when `?ws=<id>` is present and invokes onResume once.
 */
export function useWorkspaceResume({ toolSlug, enabled = true, onResume }: Options) {
  const consumedRef = useRef(false);
  const onResumeRef = useRef(onResume);
  onResumeRef.current = onResume;

  useEffect(() => {
    if (!enabled || consumedRef.current || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const wsId = params.get("ws");
    if (!wsId) return;

    consumedRef.current = true;

    const globalFile = (window as unknown as { __pdftrustedResumeFile?: File }).__pdftrustedResumeFile;
    if (globalFile) {
      delete (window as unknown as { __pdftrustedResumeFile?: File }).__pdftrustedResumeFile;
      onResumeRef.current(globalFile);
      stripWsParam();
      return;
    }

    void (async () => {
      try {
        const { getWorkspaceEntry, loadWorkspaceBlob, workspaceEntryToFile } = await import(
          "@/lib/workspaceHistory/storage"
        );
        const meta = await getWorkspaceEntry(wsId);
        if (!meta || meta.toolSlug !== toolSlug) return;
        const buffer = await loadWorkspaceBlob(wsId);
        if (!buffer) return;
        onResumeRef.current(workspaceEntryToFile(meta, buffer));
        stripWsParam();
      } catch {
        /* workspace resume is best-effort */
      }
    })();
  }, [enabled, toolSlug]);
}

function stripWsParam() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("ws");
    deferredReplaceState(url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}
