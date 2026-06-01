"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ValidationResult } from "@/lib/processing/validateProcessingRequest";
import { registerToolRightSlideOpener } from "@/lib/limits/toolRightSlideBridge";

export type ToolRightSlidePayload = {
  result: Extract<ValidationResult, { ok: false }>;
  toolSlug: string;
  file?: File | null;
  settings?: Record<string, unknown>;
  onContinuePremium?: () => void | Promise<void>;
};

type ToolRightSlideContextValue = {
  open: boolean;
  payload: ToolRightSlidePayload | null;
  openSlide: (payload: ToolRightSlidePayload) => void;
  closeSlide: () => void;
};

const ToolRightSlideContext = createContext<ToolRightSlideContextValue | null>(null);

export function ToolRightSlideProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<ToolRightSlidePayload | null>(null);

  const openSlide = useCallback((p: ToolRightSlidePayload) => {
    setPayload(p);
    setOpen(true);
  }, []);

  const closeSlide = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    registerToolRightSlideOpener(openSlide);
    return () => registerToolRightSlideOpener(() => {});
  }, [openSlide]);

  const value = useMemo(
    () => ({ open, payload, openSlide, closeSlide }),
    [open, payload, openSlide, closeSlide],
  );

  return <ToolRightSlideContext.Provider value={value}>{children}</ToolRightSlideContext.Provider>;
}

export function useToolRightSlide(): ToolRightSlideContextValue {
  const ctx = useContext(ToolRightSlideContext);
  if (!ctx) {
    return {
      open: false,
      payload: null,
      openSlide: () => {},
      closeSlide: () => {},
    };
  }
  return ctx;
}
