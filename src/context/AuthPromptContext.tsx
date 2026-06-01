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
import { useLocation } from "wouter";
import { toast } from "sonner";
import { signInWithGoogle } from "@/lib/authClient";
import { SignInWorkspaceModal } from "@/components/auth/SignInWorkspaceModal";
import { usePremium } from "@/context/PremiumContext";
import { SESSION_CHANGED_EVENT } from "@/lib/authSession";
import { logConversionEvent } from "@/utils/logger";
import {
  dispatchPremiumFlowRestore,
  loadPremiumFlow,
  type PremiumAuthIntent,
} from "@/lib/auth/premiumFlowRestore";

const INTENT_KEY = "pdftrusted-auth-intent";

export type AuthIntent = PremiumAuthIntent;

type AuthPromptContextValue = {
  requestSignIn: (intent?: AuthIntent) => void;
  closeSignIn: () => void;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

function currentPathWithSearch(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.search;
}

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<AuthIntent | undefined>();
  const [, navigate] = useLocation();
  const { isSignedIn, refreshSession } = usePremium();

  const requestSignIn = useCallback((next?: AuthIntent) => {
    const payload: AuthIntent = {
      returnPath: next?.returnPath ?? currentPathWithSearch(),
      ...next,
    };
    logConversionEvent("signup_prompt_open", {
      tool_slug: payload.toolSlug,
      tone: payload.tone,
    });
    try {
      sessionStorage.setItem(INTENT_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    setIntent(payload);
    setOpen(true);
  }, []);

  const closeSignIn = useCallback(() => setOpen(false), []);

  const runDeferredAction = useCallback(async (parsed: AuthIntent) => {
    const action = parsed.deferredAction;
    if (action === "reload") {
      window.location.reload();
      return;
    }
    if (action === "upgrade") {
      const target = parsed.returnPath ?? "/pricing";
      if (target !== currentPathWithSearch()) {
        navigate(target);
      }
      return;
    }
    if (!action) return;
    if (action === "premium-restore" || action === "enhanced") {
      const flow = await loadPremiumFlow(parsed.toolSlug);
      if (flow) {
        dispatchPremiumFlowRestore(flow, { autoStart: parsed.autoStart });
        return;
      }
      if (parsed.desiredMode === "enhanced") {
        toast.info("Welcome back! Please re-upload your file to continue with Premium processing.");
      }
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    try {
      const raw = sessionStorage.getItem(INTENT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(INTENT_KEY);
      const parsed = JSON.parse(raw) as AuthIntent;
      logConversionEvent("signup_completed", {
        tool_slug: parsed.toolSlug,
        deferred_action: parsed.deferredAction,
      });
      toast.success("Welcome back — your 10 monthly credits are ready");
      const target = parsed.returnPath;
      if (target && target !== currentPathWithSearch()) {
        navigate(target);
        setTimeout(() => void runDeferredAction(parsed), 600);
      } else {
        void runDeferredAction(parsed);
      }
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [isSignedIn, navigate, runDeferredAction]);

  useEffect(() => {
    const onSession = () => void refreshSession();
    window.addEventListener(SESSION_CHANGED_EVENT, onSession);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onSession);
  }, [refreshSession]);

  const handleGoogle = useCallback(async () => {
    const path = intent?.returnPath ?? currentPathWithSearch();
    const result = await signInWithGoogle(path);
    if (!result.ok) {
      toast.error(result.error);
    }
  }, [intent?.returnPath]);

  const value = useMemo(
    () => ({ requestSignIn, closeSignIn }),
    [requestSignIn, closeSignIn],
  );

  return (
    <AuthPromptContext.Provider value={value}>
      {children}
      <SignInWorkspaceModal
        open={open}
        onOpenChange={setOpen}
        onContinueGoogle={() => void handleGoogle()}
        reason={intent?.reason}
        tone={intent?.tone}
      />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) throw new Error("useAuthPrompt must be used within AuthPromptProvider");
  return ctx;
}

export function stashAuthIntent(intent: AuthIntent): void {
  try {
    sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}
