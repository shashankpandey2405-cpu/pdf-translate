import { openRouterChatCompletion } from "@/server/ai/openrouter";
import { modelChainForWorkload } from "@/server/ai/router";
import { chatDocumentBriefGuardrails } from "@/server/ai/guardrails";
import { trimInput } from "@/server/ai/textUtils";
import { generateSuggestedQuestions } from "@/server/ai/suggestQuestions";

export type ChatDocumentBrief = {
  summaryText: string;
  highlights: string[];
  suggestedQuestions: string[];
  suggestedActions: string[];
};

const FALLBACK_ACTIONS = [
  "Ask about dates, expiry, or deadlines in this document",
  "Verify names, ID numbers, or reference codes shown in the file",
];

function parseBriefJson(text: string): ChatDocumentBrief | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    const raw = JSON.parse(cleaned) as Record<string, unknown>;
    const summaryText =
      typeof raw.summaryText === "string" ? raw.summaryText.trim() : "";
    const highlights = Array.isArray(raw.highlights)
      ? raw.highlights
          .filter((h): h is string => typeof h === "string" && h.trim().length > 2)
          .map((h) => h.trim())
          .slice(0, 6)
      : [];
    const suggestedQuestions = Array.isArray(raw.suggestedQuestions)
      ? raw.suggestedQuestions
          .filter((q): q is string => typeof q === "string" && q.trim().length > 4)
          .map((q) => q.trim())
          .slice(0, 3)
      : [];
    const suggestedActions = Array.isArray(raw.suggestedActions)
      ? raw.suggestedActions
          .filter((a): a is string => typeof a === "string" && a.trim().length > 4)
          .map((a) => a.trim())
          .slice(0, 3)
      : [];
    if (!summaryText && highlights.length === 0) return null;
    return {
      summaryText,
      highlights,
      suggestedQuestions,
      suggestedActions: suggestedActions.length ? suggestedActions : FALLBACK_ACTIONS.slice(0, 2),
    };
  } catch {
    return null;
  }
}

export async function generateChatDocumentBrief(
  documentExcerpt: string,
  opts: {
    isPremium?: boolean;
    fileSizeBytes?: number;
    pageCount?: number;
    readMethod?: "text" | "vision_enhanced";
  },
): Promise<ChatDocumentBrief> {
  const readNote =
    opts.readMethod === "vision_enhanced"
      ? "Note: This was a scan or low-contrast PDF; text was recovered using enhanced vision reading (contrast clarified).\n\n"
      : "";
  const excerpt = trimInput(`${readNote}${documentExcerpt}`.slice(0, 12_000));
  const prompt = `${chatDocumentBriefGuardrails()}

DOCUMENT TEXT:
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
      const { text } = await openRouterChatCompletion(model, prompt, 900);
      const parsed = parseBriefJson(text);
      if (parsed) {
        if (parsed.suggestedQuestions.length < 2) {
          parsed.suggestedQuestions = await generateSuggestedQuestions(
            parsed.summaryText,
            excerpt,
            opts,
          );
        }
        if (!parsed.summaryText && parsed.highlights.length) {
          parsed.summaryText = parsed.highlights.slice(0, 2).join(" ");
        }
        return parsed;
      }
    } catch {
      continue;
    }
  }

  const suggestedQuestions = await generateSuggestedQuestions(
    excerpt.slice(0, 4000),
    excerpt,
    opts,
  );
  return {
    summaryText:
      "I read your document. Ask me about names, dates, reference numbers, or any section you see in the file.",
    highlights: [],
    suggestedQuestions,
    suggestedActions: FALLBACK_ACTIONS,
  };
}

/** When native PDF text is thin, use vision with contrast-focused hints. */
export function shouldEnhanceScanForChat(
  totalChars: number,
  pageCount: number,
  fileSizeBytes: number,
): boolean {
  if (totalChars < 40) return true;
  if (totalChars < 180) return true;
  if (pageCount > 0 && totalChars / pageCount < 90) return true;
  if (fileSizeBytes > 0 && fileSizeBytes < 400_000 && totalChars < 400) return true;
  return false;
}

export const CHAT_VISION_QUALITY_HINT =
  "Low-quality, faded, or dark scan: mentally enhance contrast (darken light text, brighten background) and read every character, date, ID, stamp, and name accurately.";
