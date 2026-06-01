import { openRouterChatCompletion } from "@/server/ai/openrouter";
import { modelChainForWorkload, type AiTask } from "@/server/ai/router";
import type { AiSummarizeTier } from "@/lib/ai/summarizeTier";
import { trimInput } from "@/server/ai/textUtils";
import { documentChatGuardrails, sanitizeChatReply } from "@/server/ai/guardrails";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function chatAboutDocument(input: {
  documentExcerpt: string;
  summaryText: string;
  messages: ChatMessage[];
  aiTier: AiSummarizeTier;
  pageCount?: number;
  fileSizeBytes?: number;
  isPremiumSubscriber?: boolean;
}): Promise<{ reply: string; promptTokens: number; completionTokens: number; model: string }> {
  const task: AiTask = "summarize";
  const isAdvanced = input.aiTier === "advanced";
  const chain = modelChainForWorkload({
    task,
    pageCount: input.pageCount ?? 2,
    totalChars: input.documentExcerpt.length,
    fileSizeBytes: input.fileSizeBytes,
    isPremium: isAdvanced || Boolean(input.isPremiumSubscriber),
  });

  const history = input.messages
    .slice(-8)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const hasSummary = input.summaryText?.trim();
  const excerptLen = hasSummary ? 8000 : 16000;

  const prompt = `${documentChatGuardrails()}
${hasSummary ? `
--- Summary ---
${trimInput(input.summaryText)}
` : ""}
--- Document Text ---
${trimInput(input.documentExcerpt.slice(0, excerptLen))}

--- Conversation ---
${history}

Reply to the user's latest message. Be precise, cite specific details from the document.`;

  let lastError: unknown;
  for (const model of chain) {
    try {
      const { text, usage } = await openRouterChatCompletion(model, prompt, 1024);
      return {
        reply: sanitizeChatReply(text),
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        model: usage.model,
      };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("chat_failed");
}
