import { openRouterChatCompletion } from "@/server/ai/openrouter";
import { modelChainForWorkload } from "@/server/ai/router";
import { trimInput } from "@/server/ai/textUtils";
import { suggestQuestionsGuardrails } from "@/server/ai/guardrails";

export async function generateSuggestedQuestions(
  summaryText: string,
  documentExcerpt: string,
  opts: { isPremium?: boolean; fileSizeBytes?: number; pageCount?: number },
): Promise<string[]> {
  const excerpt = trimInput(`${summaryText}\n\n${documentExcerpt}`.slice(0, 8000));
  const prompt = `${suggestQuestionsGuardrails()}

${excerpt}`;

  const chain = modelChainForWorkload({
    task: "summarize",
    pageCount: opts.pageCount ?? 1,
    totalChars: excerpt.length,
    fileSizeBytes: opts.fileSizeBytes,
    isPremium: opts.isPremium,
  });

  for (const model of chain) {
    try {
      const { text } = await openRouterChatCompletion(model, prompt, 400);
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((q): q is string => typeof q === "string" && q.trim().length > 4)
          .slice(0, 3);
      }
    } catch {
      continue;
    }
  }

  return [
    "What are the main points in this document?",
    "Are there any dates or deadlines I should know?",
    "What actions should I take based on this PDF?",
  ];
}
