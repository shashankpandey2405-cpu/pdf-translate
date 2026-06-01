import { createContext, useContext, useState } from "react";

export interface ProcessedFile {
  blob: Blob;
  filename: string;
  tool: string;
  toolSlug: string;
  originalSize: number;
  processedSize: number;
  /** Optional cloud delete metadata used by some legacy pages. */
  cloudPurge?: unknown;
}

interface ProcessContextType {
  processedFile: ProcessedFile | null;
  setProcessedFile: (file: ProcessedFile | null) => void;
  clearProcessedFile: () => void;
}

const ProcessContext = createContext<ProcessContextType | null>(null);

export function ProcessProvider({ children }: { children: React.ReactNode }) {
  const [processedFile, setProcessedFileState] = useState<ProcessedFile | null>(null);

  function setProcessedFile(file: ProcessedFile | null) {
    setProcessedFileState(file);
  }

  function clearProcessedFile() {
    setProcessedFileState(null);
  }

  return (
    <ProcessContext.Provider value={{ processedFile, setProcessedFile, clearProcessedFile }}>
      {children}
    </ProcessContext.Provider>
  );
}

export function useProcess() {
  const ctx = useContext(ProcessContext);
  if (!ctx) throw new Error("useProcess must be used within ProcessProvider");
  return ctx;
}
