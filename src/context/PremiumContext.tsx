import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getToolLimitConfig } from "@/tools/toolPipeline/toolLimits";
import { mockPremiumEnabled } from "@/lib/devPremium";
import { authOnlyProductMode, isAuthEnabled, showAuthPremiumMarketingUi } from "@/lib/featureFlags";
import {
  fetchSession,
  SESSION_CHANGED_EVENT,
  type SessionUser,
} from "@/lib/authSession";
import { SIZE_EXCEEDS_CLOUD_MAX, SIZE_EXCEEDS_PREMIUM_MAX } from "@/lib/uploadTiers";
import { isPrivacyFirstMode } from "@/lib/trustShield/storage";
import { TRUST_SHIELD_BULK_MAX_FILES } from "@/lib/trustShield/constants";
import { getBrowserLimits } from "@/lib/limits/browserLimits";
import {
  assessBrowserWorkload,
  CLOUD_MAX_FILE_MB,
  getDeviceBrowserLimits,
} from "@/lib/limits/deviceAdaptiveLimits";
import { assessLocalBrowserTool, isLocalBrowserTool } from "@/lib/limits/localBrowserTools";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { supabaseUserToSessionUser } from "@/lib/supabase/user";
import type { AuthChangeEvent } from "@supabase/supabase-js";

export type { SessionUser };

/** Browser UI hints — actual caps come from getDeviceBrowserLimits(). */
export const FREE_LIMITS = {
  maxFiles: 100,
  maxFileSizeMB: 80,
};

export const SIGNED_IN_LIMITS = {
  maxFiles: 100,
  /** Trusted Cloud (free account) max upload. */
  maxFileSizeMB: CLOUD_MAX_FILE_MB,
};

/** Paid subscription tier. */
export const PREMIUM_LIMITS = {
  maxFiles: 100,
  maxFileSizeMB: 500,
};

export type AccessTier = "guest" | "signed_in" | "premium";
export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export type CanUseOptions = {
  /** Largest single file in the batch (MB). Required for accurate multi-file checks. */
  largestFileMB?: number;
  pageCount?: number | null;
};

interface PremiumContextType {
  isPremium: boolean;
  tier: AccessTier;
  isSignedIn: boolean;
  sessionUser: SessionUser;
  sessionStatus: SessionStatus;
  refreshSession: (opts?: { background?: boolean }) => Promise<void>;
  setPremium: (val: boolean) => void;
  canUse: (
    fileCount: number,
    totalSizeMB: number,
    slug?: string,
    opts?: CanUseOptions,
  ) => { allowed: boolean; reason?: string; suggestCloud?: boolean; suggestSignIn?: boolean };
  getLimits: (slug?: string) => { maxFiles: number; maxFileSizeMB: number };
  getBrowserLimits: () => ReturnType<typeof getBrowserLimits>;
}

const PremiumContext = createContext<PremiumContextType | null>(null);

function initialSessionStatus(): SessionStatus {
  if (!isAuthEnabled() && !showAuthPremiumMarketingUi()) return "unauthenticated";
  if (isAuthEnabled()) return "loading";
  return "unauthenticated";
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(() => mockPremiumEnabled());
  const [sessionUser, setSessionUser] = useState<SessionUser>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(initialSessionStatus);
  const initialLoadDone = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSession = useCallback(async (opts?: { background?: boolean }) => {
    if (!isAuthEnabled() && !showAuthPremiumMarketingUi()) {
      setSessionUser(null);
      setSessionStatus("unauthenticated");
      return;
    }

    const background = opts?.background ?? initialLoadDone.current;

    if (isAuthEnabled() && !background) {
      setSessionStatus((prev) => (prev === "authenticated" ? "authenticated" : "loading"));
    }

    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const { data: local } = await supabase.auth.getSession();
          if (local.session?.user) {
            const optimistic = supabaseUserToSessionUser(local.session.user);
            if (optimistic) {
              setSessionUser(optimistic);
              setSessionStatus("authenticated");
            }
          }
        }
      }

      const data = await fetchSession();
      setSessionUser(data.user);
      if (mockPremiumEnabled()) {
        setIsPremium(true);
      } else {
        setIsPremium(data.isPremium);
      }
      setSessionStatus(data.user ? "authenticated" : "unauthenticated");
    } catch {
      if (!background) {
        let recovered: SessionUser = null;
        if (isSupabaseConfigured()) {
          try {
            const supabase = getSupabaseBrowserClient();
            const { data: local } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
            if (local.session?.user) {
              recovered = supabaseUserToSessionUser(local.session.user);
            }
          } catch {
            /* ignore */
          }
        }
        if (recovered) {
          setSessionUser(recovered);
          setSessionStatus("authenticated");
        } else {
          setSessionUser(null);
          if (!mockPremiumEnabled()) setIsPremium(false);
          setSessionStatus("unauthenticated");
        }
      }
    } finally {
      initialLoadDone.current = true;
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      void refreshSession({ background: true });
    }, 800);
  }, [refreshSession]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        void refreshSession({ background: event !== "SIGNED_IN" });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(SESSION_CHANGED_EVENT));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [refreshSession]);

  useEffect(() => {
    if (!isAuthEnabled() && !showAuthPremiumMarketingUi()) {
      return;
    }

    void refreshSession({ background: false });

    const onRefresh = () => scheduleRefresh();
    window.addEventListener("focus", onRefresh);
    window.addEventListener("pageshow", onRefresh);
    window.addEventListener(SESSION_CHANGED_EVENT, onRefresh);
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("pageshow", onRefresh);
      window.removeEventListener(SESSION_CHANGED_EVENT, onRefresh);
    };
  }, [refreshSession, scheduleRefresh]);

  const tier: AccessTier = useMemo(() => {
    if (!isAuthEnabled() && !showAuthPremiumMarketingUi()) return "guest";
    if (isPremium) return "premium";
    if (sessionUser) return "signed_in";
    return "guest";
  }, [isPremium, sessionUser]);

  const authEnabled = isAuthEnabled();
  const exposedUser: SessionUser = authEnabled ? sessionUser : null;
  const isSignedIn = authEnabled && !!sessionUser;

  function setPremium(val: boolean) {
    setIsPremium(val);
    if (typeof document === "undefined") return;
    if (process.env.NODE_ENV !== "development" && !mockPremiumEnabled()) return;
    if (val) {
      document.cookie = "pt_premium=1; Path=/; Max-Age=31536000; SameSite=Lax";
    } else {
      document.cookie = "pt_premium=; Path=/; Max-Age=0; SameSite=Lax";
    }
  }

  function getLimits(slug?: string) {
    const device = getBrowserLimits(tier);
    if (isPrivacyFirstMode()) {
      return {
        maxFiles: TRUST_SHIELD_BULK_MAX_FILES,
        maxFileSizeMB: device.maxFileMB,
      };
    }
    const perTool = slug ? getToolLimitConfig(slug) : null;
    const perToolFiles =
      tier === "signed_in"
        ? (perTool?.maxFilesAuthed ?? device.maxMergeFiles)
        : (perTool?.maxFilesGuest ?? device.maxMergeFiles);
    return {
      maxFiles: Math.min(perToolFiles, device.maxMergeFiles),
      maxFileSizeMB: device.maxFileMB,
    };
  }

  function canUse(fileCount: number, totalSizeMB: number, slug?: string, opts?: CanUseOptions) {
    try {
      const largestFileMB =
        opts?.largestFileMB ?? (fileCount === 1 ? totalSizeMB : undefined);

      if (largestFileMB === undefined) {
        return {
          allowed: false,
          reason: "Multi-file validation requires per-file size data. Please refresh and try again.",
        };
      }

      if (slug && isLocalBrowserTool(slug)) {
        const local = assessLocalBrowserTool(tier, slug, largestFileMB, opts?.pageCount);
        if (!local.allowed) {
          return { allowed: false, reason: local.reason };
        }
        return { allowed: true };
      }

      const cloudMaxMb = isPremium ? PREMIUM_LIMITS.maxFileSizeMB : CLOUD_MAX_FILE_MB;

      if (isPremium && largestFileMB <= PREMIUM_LIMITS.maxFileSizeMB) {
        return { allowed: true };
      }

      if (isSignedIn && largestFileMB > cloudMaxMb) {
        return {
          allowed: false,
          reason: isPremium ? SIZE_EXCEEDS_PREMIUM_MAX : SIZE_EXCEEDS_CLOUD_MAX,
        };
      }

      const assessment = assessBrowserWorkload({
        slug,
        fileCount,
        largestFileMB,
        isSignedIn,
      });

      if (!assessment.allowed) {
        return {
          allowed: false,
          reason: assessment.message,
          suggestCloud: assessment.suggestCloud,
          suggestSignIn: assessment.suggestSignIn,
        };
      }

      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        tier,
        isSignedIn,
        sessionUser: exposedUser,
        sessionStatus: authEnabled ? sessionStatus : "unauthenticated",
        refreshSession,
        setPremium,
        canUse,
        getLimits,
        getBrowserLimits: () => getBrowserLimits(tier),
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used within PremiumProvider");
  return ctx;
}
