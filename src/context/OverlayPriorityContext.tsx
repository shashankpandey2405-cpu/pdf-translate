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

/** Lower number = lower priority (shown only when nothing higher is active). */
export const OVERLAY_PRIORITY = {
  pwaInstall: 10,
  cookieConsent: 20,
  returningGuest: 30,
  guestIdle: 40,
  exitIntent: 50,
  postResultSignup: 60,
  feedbackModal: 70,
} as const;

export type OverlayId = keyof typeof OVERLAY_PRIORITY;

type OverlayPriorityContextValue = {
  activeId: OverlayId | null;
  requestShow: (id: OverlayId) => boolean;
  release: (id: OverlayId) => void;
  isVisible: (id: OverlayId) => boolean;
};

const OverlayPriorityContext = createContext<OverlayPriorityContextValue | null>(null);

export function OverlayPriorityProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<OverlayId | null>(null);

  const requestShow = useCallback((id: OverlayId): boolean => {
    const priority = OVERLAY_PRIORITY[id];
    let allowed = false;
    setActiveId((cur) => {
      if (cur === null || cur === id) {
        allowed = true;
        return id;
      }
      if (priority > OVERLAY_PRIORITY[cur]) {
        allowed = true;
        return id;
      }
      allowed = false;
      return cur;
    });
    return allowed;
  }, []);

  const release = useCallback((id: OverlayId) => {
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const isVisible = useCallback((id: OverlayId) => activeId === id, [activeId]);

  const value = useMemo(
    () => ({ activeId, requestShow, release, isVisible }),
    [activeId, requestShow, release, isVisible],
  );

  return (
    <OverlayPriorityContext.Provider value={value}>{children}</OverlayPriorityContext.Provider>
  );
}

export function useOverlayPriority() {
  const ctx = useContext(OverlayPriorityContext);
  if (!ctx) {
    return {
      activeId: null as OverlayId | null,
      requestShow: () => true,
      release: () => {},
      isVisible: () => true,
    };
  }
  return ctx;
}

/** Reserve overlay slot when wantsOpen becomes true. */
export function useOverlaySlot(id: OverlayId, wantsOpen: boolean) {
  const { requestShow, release, isVisible } = useOverlayPriority();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!wantsOpen) {
      release(id);
      setGranted(false);
      return;
    }
    const ok = requestShow(id);
    setGranted(ok);
    return () => release(id);
  }, [wantsOpen, id, requestShow, release]);

  return {
    visible: wantsOpen && granted && isVisible(id),
    dismiss: () => release(id),
  };
}
