import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { authOnlyProductMode, showAuthPremiumMarketingUi } from "@/lib/featureFlags";

interface PremiumGateProps {
  reason: string;
  onDismiss?: () => void;
}

/** Legacy paid-subscription gate — hidden in auth-only launch (free enhanced cloud quota instead). */
export default function PremiumGate({ reason, onDismiss }: PremiumGateProps) {
  if (!showAuthPremiumMarketingUi()) return null;
  if (authOnlyProductMode()) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl"
      data-testid="premium-gate"
    >
      <div className="text-center max-w-xs px-6">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Sign in required</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{reason}</p>
        {onDismiss ? (
          <button
            type="button"
            data-testid="button-dismiss-premium-gate"
            onClick={onDismiss}
            className="w-full px-5 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
