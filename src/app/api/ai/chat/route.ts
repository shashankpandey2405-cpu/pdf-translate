import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { requireApiUser } from "@/server/enhanced/auth";
import { runApiGuard } from "@/server/security/apiGuard";
import { getAiSession } from "@/server/ai/sessionStore";
import { chatAboutDocument, type ChatMessage } from "@/server/ai/chatDocument";
import { getCreditBalance, reserveCredits, settleCreditHold, releaseCreditHold } from "@/server/credits/ledger";
import { settleAiCredits } from "@/server/credits/calculator";
import { getAppEnv } from "@/server/types";
import { resolveIsPremium } from "@/server/premiumEntitlement";
import { requiresPremiumForTier } from "@/lib/ai/summarizeTier";
import { randomUUID } from "crypto";

const CHAT_CREDITS = 2;
const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY_ITEM_CHARS = 2000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function postChat(req: Request) {
  const guard = await runApiGuard(req, { burstBucket: "ai_chat", ipHourlyMax: 60 });
  if (guard) return guard;

  const user = await requireApiUser();
  if (user instanceof Response) return user;

  let body: {
    jobId?: unknown;
    message?: unknown;
    messages?: unknown;
    aiTier?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE_CHARS) : "";
  const aiTier = body.aiTier === "advanced" ? "advanced" : "standard";

  if (!jobId || !message) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const env = getAppEnv();
  const isPremium = await resolveIsPremium(req, env);
  if (requiresPremiumForTier(aiTier) && !isPremium) {
    return Response.json(
      { error: "premium_required", message: "Advanced AI requires Premium." },
      { status: 403 },
    );
  }

  const session = await getAiSession(jobId);
  if (!session || session.userId !== user.id) {
    return Response.json({ error: "session_not_found" }, { status: 404 });
  }

  const history: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m): m is ChatMessage =>
            typeof m === "object" &&
            m !== null &&
            (m as ChatMessage).role !== undefined &&
            typeof (m as ChatMessage).content === "string",
        )
        .slice(-12)
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, MAX_HISTORY_ITEM_CHARS),
        }))
    : [];

  const holdId = `chat-${randomUUID()}`;
  const reserved = await reserveCredits(user.id, holdId, CHAT_CREDITS, isPremium, {
    type: "ai_chat",
    jobId,
  });
  if (!reserved.ok) {
    return Response.json(
      { error: reserved.code, message: reserved.message },
      { status: 402 },
    );
  }

  try {
    const { reply, promptTokens, completionTokens, model } = await chatAboutDocument({
      documentExcerpt: session.documentExcerpt,
      summaryText: session.summaryText,
      messages: [...history, { role: "user", content: message }],
      aiTier,
      isPremiumSubscriber: isPremium,
    });

    const chatToolSlug = session.summaryText ? "ai-summarize" : "chat-pdf";
    const actual = settleAiCredits({
      toolSlug: chatToolSlug,
      pageCount: 1,
      promptTokens,
      completionTokens,
      modelId: model,
    });
    await settleCreditHold(holdId, Math.max(CHAT_CREDITS, actual));

    const balance = await getCreditBalance(user.id, isPremium);

    return Response.json({
      ok: true,
      reply,
      creditsCharged: Math.max(CHAT_CREDITS, actual),
      credits: balance,
    });
  } catch (e) {
    await releaseCreditHold(holdId);
    const msg = e instanceof Error ? e.message : "Chat failed";
    return Response.json({ error: "chat_failed", message: msg }, { status: 500 });
  }
}

export const POST = withSentryRoute("ai_chat", postChat);
