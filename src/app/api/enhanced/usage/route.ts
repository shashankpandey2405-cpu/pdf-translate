import { requireApiUser } from "@/server/enhanced/auth";
import { isEnhancedInfraConfigured } from "@/server/enhanced/config";
import { getUsageSnapshotFull } from "@/server/enhanced/usageLimits";
import { getAiTrialSnapshot } from "@/server/ai/usageLimits";
import { getCreditBalance } from "@/server/credits/ledger";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { getAppEnv } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isEnhancedInfraConfigured()) {
    return Response.json({
      enabled: false,
      enhancedRemaining: 0,
      dailyLimit: 2,
      message: "Enhanced processing is not configured on this deployment.",
    });
  }

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  try {
    const env = getAppEnv();
    const isPremium = await resolveIsPremium(req, env);
    const snap = await getUsageSnapshotFull(user.id);
    const aiTrial = await getAiTrialSnapshot(user.id);
    const credits = await getCreditBalance(user.id, isPremium);

    const payload = {
      enabled: true,
      ...snap,
      aiTrial,
      credits,
    };

    if (!isPremium) {
      return Response.json({
        ...payload,
        enhancedRemaining: credits.available,
        dailyLimit: credits.monthlyGrant,
        quotaKind: "monthly_credits" as const,
      });
    }

    return Response.json(payload);
  } catch {
    return Response.json({
      enabled: false,
      enhancedRemaining: 0,
      dailyLimit: 2,
      message: "Enhanced usage tracking is temporarily unavailable.",
    });
  }
}
