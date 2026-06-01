"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearLocalHistory,
  deleteLocalHistoryEntry,
  listLocalHistory,
  loadLocalHistoryBlob,
} from "@/lib/history/localHistory";
import type { LocalHistoryEntry } from "@/lib/history/types";

export function useLocalHistory() {
  const [entries, setEntries] = useState<LocalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listLocalHistory();
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      await deleteLocalHistoryEntry(id);
      await refresh();
    },
    [refresh],
  );

  const clearAll = useCallback(async () => {
    await clearLocalHistory();
    await refresh();
  }, [refresh]);

  const downloadEntry = useCallback(async (entry: LocalHistoryEntry) => {
    const blob = await loadLocalHistoryBlob(entry.id);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = entry.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  return { entries, loading, refresh, remove, clearAll, downloadEntry };
}
