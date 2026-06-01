"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RailValidationFlags = {
  processing?: boolean;
  options?: boolean;
  account?: boolean;
  run?: boolean;
};

type OpenOpts = { force?: boolean };

type ToolRightRailContextValue = {
  isOpen: boolean;
  userDismissed: boolean;
  validation: RailValidationFlags;
  openRail: (opts?: OpenOpts) => void;
  closeRail: () => void;
  toggleRail: () => void;
  highlightValidation: (flags: RailValidationFlags) => void;
  clearValidation: () => void;
};

const ToolRightRailContext = createContext<ToolRightRailContextValue | null>(null);

export function ToolRightRailProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [userDismissed, setUserDismissed] = useState(false);
  const [validation, setValidation] = useState<RailValidationFlags>({});

  const openRail = useCallback((opts?: OpenOpts) => {
    if (opts?.force) {
      setUserDismissed(false);
      setIsOpen(true);
      return;
    }
    setUserDismissed(false);
    setIsOpen(true);
  }, []);

  const closeRail = useCallback(() => {
    setUserDismissed(true);
    setIsOpen(false);
  }, []);

  const toggleRail = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      setUserDismissed(!next);
      return next;
    });
  }, []);

  const highlightValidation = useCallback((flags: RailValidationFlags) => {
    setValidation(flags);
    setUserDismissed(false);
    setIsOpen(true);
  }, []);

  const clearValidation = useCallback(() => setValidation({}), []);

  const value = useMemo(
    () => ({
      isOpen,
      userDismissed,
      validation,
      openRail,
      closeRail,
      toggleRail,
      highlightValidation,
      clearValidation,
    }),
    [isOpen, userDismissed, validation, openRail, closeRail, toggleRail, highlightValidation, clearValidation],
  );

  return <ToolRightRailContext.Provider value={value}>{children}</ToolRightRailContext.Provider>;
}

export function useToolRightRail(): ToolRightRailContextValue {
  const ctx = useContext(ToolRightRailContext);
  if (!ctx) {
    return {
      isOpen: true,
      userDismissed: false,
      validation: {},
      openRail: () => {},
      closeRail: () => {},
      toggleRail: () => {},
      highlightValidation: () => {},
      clearValidation: () => {},
    };
  }
  return ctx;
}
