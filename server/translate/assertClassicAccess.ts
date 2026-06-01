import { estimateClassicMtCredits } from "@/server/credits/calculator";
import { getCreditBalance } from "@/server/credits/ledger";
import { isClassicMtConfigured } from "@/server/translate/config";
import { maxPagesAffordableWithCredits } from "@/server/credits/aiWorkloadLimits";

export type ClassicMtGateResult =
  | { ok: true; estimateHigh: number }
  | { ok: false; code: string; message: string; status: number };

export async function assertCanRunClassicMt(params: {
  userId: string;
  pageCount: number;
  fileSizeBytes: number;
  isPremium: boolean;
}): Promise<ClassicMtGateResult> {
  if (!isClassicMtConfigured()) {
    return {
      ok: false,
      code: "classic_mt_unavailable",
      message:
        "Classic translation is not configured. Deploy translate-mt and set TRANSLATE_MT_URL on Vercel and the translate worker.",
      status: 503,
    };
  }

  const pages = Math.max(1, params.pageCount);
  const estimate = estimateClassicMtCredits({
    toolSlug: "translate-pdf",
    pageCount: pages,
    fileSizeBytes: params.fileSizeBytes,
    isPremium: params.isPremium,
  });

  const credits = await getCreditBalance(params.userId, params.isPremium);
  const maxPages = maxPagesAffordableWithCredits("translate-pdf", credits.available, params.isPremium);

  if (pages > maxPages) {
    return {
      ok: false,
      code: "too_many_pages",
      message: `Your balance supports up to ${maxPages} pages for Classic translate (${credits.available} credits).`,
      status: 413,
    };
  }

  if (credits.available >= estimate.estimateHigh) {
    return { ok: true, estimateHigh: estimate.estimateHigh };
  }

  return {
    ok: false,
    code: "INSUFFICIENT_CREDITS",
    message: `Need at least ${estimate.estimateHigh} credits for Classic translate (you have ${credits.available}).`,
    status: 402,
  };
}
