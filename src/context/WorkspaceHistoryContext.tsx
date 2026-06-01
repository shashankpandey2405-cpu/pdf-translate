"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WORKSPACE_RESUMABLE_SLUGS } from "@/lib/workspaceHistory/constants";
import type { WorkspaceHistoryEntry, WorkspaceSaveInput } from "@/lib/workspaceHistory/types";
import { useHydrated } from "@/hooks/useHydrated";
import { localeFromWindow, localePath } from "@/lib/appPaths";
import { usePremium } from "@/context/PremiumContext";

type WorkspaceHistoryContextValue = {
  entries: WorkspaceHistoryEntry[];
  loading: boolean;
  totalBytes: number;
  refresh: () => Promise<void>;
  saveSession: (input: WorkspaceSaveInput) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  resumeEntry: (entry: WorkspaceHistoryEntry) => Promise<boolean>;
  canResume: (entry: WorkspaceHistoryEntry) => boolean;
};

const WorkspaceHistoryContext = createContext<WorkspaceHistoryContextValue | null>(null);

async function loadStorage() {
  return import("@/lib/workspaceHistory/storage");
}

export function WorkspaceHistoryProvider({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const { isSignedIn } = usePremium();
  const [entries, setEntries] = useState<WorkspaceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const wasSignedInRef = useRef(isSignedIn);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined" || !isSignedIn) {
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const { listWorkspaceHistory } = await loadStorage();
      setEntries(await listWorkspaceHistory());
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  useEffect(() => {
    if (!hydrated) return;
    if (wasSignedInRef.current && !isSignedIn) {
      void (async () => {
        try {
          const { clearAllWorkspaceHistory } = await loadStorage();
          await clearAllWorkspaceHistory();
        } catch {
          /* ignore */
        }
        setEntries([]);
      })();
    }
    wasSignedInRef.current = isSignedIn;
  }, [hydrated, isSignedIn]);

  const saveSession = useCallback(
    async (input: WorkspaceSaveInput) => {
      if (!isSignedIn) return;
      const { saveWorkspaceSession } = await loadStorage();
      await saveWorkspaceSession(input);
      await refresh();
    },
    [isSignedIn, refresh],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!isSignedIn) return;
      const { deleteWorkspaceEntry } = await loadStorage();
      await deleteWorkspaceEntry(id);
      await refresh();
    },
    [isSignedIn, refresh],
  );

  const clearAll = useCallback(async () => {
    if (!isSignedIn) {
      setEntries([]);
      return;
    }
    const { clearAllWorkspaceHistory } = await loadStorage();
    await clearAllWorkspaceHistory();
    await refresh();
  }, [isSignedIn, refresh]);

  const canResume = useCallback((entry: WorkspaceHistoryEntry) => {
    return WORKSPACE_RESUMABLE_SLUGS.has(entry.toolSlug);
  }, []);

  const resumeEntry = useCallback(
    async (entry: WorkspaceHistoryEntry) => {
      if (typeof window === "undefined" || !isSignedIn) return false;
      if (!canResume(entry)) return false;
      const { loadWorkspaceBlob, workspaceEntryToFile } = await loadStorage();
      const buffer = await loadWorkspaceBlob(entry.id);
      if (!buffer) {
        await removeEntry(entry.id);
        return false;
      }
      const file = workspaceEntryToFile(entry, buffer);
      (window as unknown as { __pdftrustedResumeFile?: File }).__pdftrustedResumeFile = file;
      const qs = `?ws=${encodeURIComponent(entry.id)}`;
      window.location.assign(localePath(`/${entry.toolSlug}${qs}`, localeFromWindow()));
      return true;
    },
    [isSignedIn, canResume, removeEntry],
  );

  const totalBytes = useMemo(() => entries.reduce((sum, e) => sum + e.size, 0), [entries]);

  const value = useMemo(
    () => ({
      entries,
      loading,
      totalBytes,
      refresh,
      saveSession,
      removeEntry,
      clearAll,
      resumeEntry,
      canResume,
    }),
    [entries, loading, totalBytes, refresh, saveSession, removeEntry, clearAll, resumeEntry, canResume],
  );

  return (
    <WorkspaceHistoryContext.Provider value={value}>{children}</WorkspaceHistoryContext.Provider>
  );
}

export function useWorkspaceHistory(): WorkspaceHistoryContextValue {
  const ctx = useContext(WorkspaceHistoryContext);
  if (!ctx) {
    throw new Error("useWorkspaceHistory must be used within WorkspaceHistoryProvider");
  }
  return ctx;
}
