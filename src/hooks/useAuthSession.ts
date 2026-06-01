import { usePremium } from "@/context/PremiumContext";

/** Auth session from PremiumProvider (Auth.js via /api/session). Not next-auth useSession. */
export function useAuthSession() {
  const { sessionUser, isSignedIn, sessionStatus, refreshSession } = usePremium();

  const isLoading = sessionStatus === "loading";
  const status = sessionStatus;

  return {
    user: sessionUser,
    isSignedIn,
    isLoading,
    status,
    refresh: refreshSession,
  };
}
