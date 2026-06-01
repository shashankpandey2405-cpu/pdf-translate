import { useState, useCallback } from "react";
import type { Annotation } from "../types";

export function useAnnotationHistory(initialAnnotations: Annotation[] = []) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations]);
  const [histIdx, setHistIdx] = useState(0);

  const pushHistory = useCallback(
    (newAnnotations: Annotation[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, histIdx + 1);
        newHistory.push(newAnnotations);
        return newHistory;
      });
      setHistIdx((prev) => prev + 1);
      setAnnotations(newAnnotations);
    },
    [histIdx]
  );

  const undo = useCallback(() => {
    if (histIdx <= 0) return;
    const newIdx = histIdx - 1;
    setHistIdx(newIdx);
    setAnnotations(history[newIdx]);
  }, [histIdx, history]);

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    const newIdx = histIdx + 1;
    setHistIdx(newIdx);
    setAnnotations(history[newIdx]);
  }, [histIdx, history]);

  return {
    annotations,
    setAnnotations,
    pushHistory,
    undo,
    redo,
    canUndo: histIdx > 0,
    canRedo: histIdx < history.length - 1,
  };
}
