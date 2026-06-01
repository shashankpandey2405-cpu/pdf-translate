import { randomUUID } from "crypto";
import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { translateDocumentText } from "@/server/ai/documentAi";
import { langLabel } from "@/lib/ai/translateLanguages";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { getAppEnv } from "@/server/types";
import { assertCanRunAiPlus } from "@/server/ai/assertAiAccess";
import { estimateAiCredits, settleAiCredits } from "@/server/credits/calculator";
import {
  getCreditBalance,
  releaseCreditHold,
  reserveCredits,
  settleCreditHold,
} from "@/server/credits/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postHandler(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "ai_translate", ipHourlyMax: 30 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: { text?: unknown; targetLang?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const targetLang = typeof body.targetLang === "string" ? body.targetLang : "en";
  if (!text || text.length > 12000) {
    return Response.json({ error: "invalid_text", message: "Text is empty or too long." }, { status: 400 });
  }

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);

  const gate = await assertCanRunAiPlus({
    userId: user.id,
    toolSlug: "translate-pdf",
    pageCount: 1,
    fileSizeBytes: text.length * 2,
    isPremium,
  });
  if (!gate.ok) {
    return Response.json({ error: gate.code, message: gate.message }, { status: gate.status });
  }

  const holdId = `translate-snippet-${randomUUID()}`;
  if (!gate.useTrial) {
    const reserved = await reserveCredits(user.id, holdId, gate.estimateHigh, isPremium, {
      type: "ai_translate_snippet",
      chars: text.length,
    });
    if (!reserved.ok) {
      return Response.json(
        { error: reserved.code, message: reserved.message },
        { status: 402 },
      );
    }
  }

  try {
    const label = langLabel(targetLang);
    const { pages, usage } = await translateDocumentText([text], "auto", label, { isPremium });
    const translated = pages.join("\n\n").trim();

    if (!gate.useTrial) {
      const actual = settleAiCredits({
        toolSlug: "translate-pdf",
        pageCount: 1,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        modelId: usage.model,
      });
      const estimate = estimateAiCredits({
        toolSlug: "translate-pdf",
        pageCount: 1,
        totalChars: text.length,
        isPremium,
      });
      await settleCreditHold(holdId, Math.max(estimate.estimate, actual));
    }

    const balance = await getCreditBalance(user.id, isPremium);
    return Response.json({
      translated,
      creditsCharged: gate.useTrial ? 0 : undefined,
      credits: balance,
    });
  } catch (e) {
    if (!gate.useTrial) await releaseCreditHold(holdId);
    const msg = e instanceof Error ? e.message : "Translation failed";
    return Response.json({ error: "translate_failed", message: msg }, { status: 502 });
  }
}

export const POST = withSentryRoute("ai.translate-snippet", postHandler);
