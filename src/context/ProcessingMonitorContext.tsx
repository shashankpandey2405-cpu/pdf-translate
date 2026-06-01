"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ProcessingMonitorState = {
  mode: "browser" | "enhanced" | "idle";
  fileName?: string;
  fileSizeBytes?: number;
  networkUploads: number;
  active: boolean;
};

type ProcessingMonitorContextValue = {
  state: ProcessingMonitorState;
  setMonitor: (patch: Partial<ProcessingMonitorState>) => void;
  resetMonitor: () => void;
  recordNetworkUpload: () => void;
};

const defaultState: ProcessingMonitorState = {
  mode: "idle",
  networkUploads: 0,
  active: false,
};

const ProcessingMonitorContext = createContext<ProcessingMonitorContextValue | null>(null);

export function ProcessingMonitorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProcessingMonitorState>(defaultState);

  const setMonitor = useCallback((patch: Partial<ProcessingMonitorState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetMonitor = useCallback(() => {
    setState(defaultState);
  }, []);

  const recordNetworkUpload = useCallback(() => {
    setState((prev) => ({ ...prev, networkUploads: prev.networkUploads + 1 }));
  }, []);

  const value = useMemo(
    () => ({ state, setMonitor, resetMonitor, recordNetworkUpload }),
    [state, setMonitor, resetMonitor, recordNetworkUpload],
  );

  return (
    <ProcessingMonitorContext.Provider value={value}>{children}</ProcessingMonitorContext.Provider>
  );
}

export function useProcessingMonitor() {
  const ctx = useContext(ProcessingMonitorContext);
  if (!ctx) {
    return {
      state: defaultState,
      setMonitor: () => {},
      resetMonitor: () => {},
      recordNetworkUpload: () => {},
    };
  }
  return ctx;
}
