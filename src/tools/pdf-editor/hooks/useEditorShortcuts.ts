import { useEffect, useRef } from "react";

type Handlers = {
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelection: () => void;
};

/** Undo/redo/delete selection — skips when typing in inputs. */
export function useEditorShortcuts(enabled: boolean, handlers: Handlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable='true']")) return;

      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) ref.current.onRedo();
        else ref.current.onUndo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        ref.current.onRedo();
        return;
      }
      if (!meta && e.key === "Delete") {
        e.preventDefault();
        ref.current.onDeleteSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
