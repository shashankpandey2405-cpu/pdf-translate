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
import { TRUST_SHIELD_BULK_MAX_FILES } from "@/lib/trustShield/constants";
import {
  isPrivacyFirstMode,
  isPrivacyNoticeSeen,
  setPrivacyFirstMode,
  setPrivacyNoticeSeen,
} from "@/lib/trustShield/storage";

type TrustShieldContextValue = {
  privacyFirst: boolean;
  setPrivacyFirst: (on: boolean) => void;
  bulkMaxFiles: number;
  badgeLabel: string;
  privacyNoticeSeen: boolean;
  storageReady: boolean;
  dismissPrivacyNotice: () => void;
};

const TrustShieldContext = createContext<TrustShieldContextValue | null>(null);

export function TrustShieldProvider({ children }: { children: ReactNode }) {
  const [privacyFirst, setPrivacyFirstState] = useState(true);
  const [privacyNoticeSeen, setPrivacyNoticeSeenState] = useState(true);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setPrivacyFirstState(isPrivacyFirstMode());
    setPrivacyNoticeSeenState(isPrivacyNoticeSeen());
    setStorageReady(true);
  }, []);

  const setPrivacyFirst = useCallback((on: boolean) => {
    setPrivacyFirstMode(on);
    setPrivacyFirstState(on);
  }, []);

  const dismissPrivacyNotice = useCallback(() => {
    setPrivacyNoticeSeen();
    setPrivacyNoticeSeenState(true);
  }, []);

  const value = useMemo(
    () => ({
      privacyFirst,
      setPrivacyFirst,
      bulkMaxFiles: privacyFirst ? TRUST_SHIELD_BULK_MAX_FILES : 20,
      badgeLabel: "Secured by PDFTrusted",
      privacyNoticeSeen: storageReady ? privacyNoticeSeen : true,
      storageReady,
      dismissPrivacyNotice,
    }),
    [privacyFirst, privacyNoticeSeen, storageReady, setPrivacyFirst, dismissPrivacyNotice],
  );

  return <TrustShieldContext.Provider value={value}>{children}</TrustShieldContext.Provider>;
}

export function useTrustShield(): TrustShieldContextValue {
  const ctx = useContext(TrustShieldContext);
  if (!ctx) {
    return {
      privacyFirst: true,
      setPrivacyFirst: () => undefined,
      bulkMaxFiles: TRUST_SHIELD_BULK_MAX_FILES,
      badgeLabel: "Secured by PDFTrusted",
      privacyNoticeSeen: true,
      storageReady: false,
      dismissPrivacyNotice: () => undefined,
    };
  }
  return ctx;
}
