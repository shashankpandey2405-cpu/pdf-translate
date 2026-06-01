import {
  OPENROUTER_API_KEY,
  OPENROUTER_APP_NAME,
  OPENROUTER_APP_URL,
} from "@/server/ai/config";
import { openRouterChatCompletion } from "@/server/ai/openrouter";
import type { DocumentAnalysis } from "@/server/ai/visionAnalyze";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const REVISE_MODEL = "google/gemini-2.5-flash";

export type SmartScanAttachment = {
  name: string;
  mimeType: string;
  base64: string;
};

function ensureApiKey(): string {
  const key = OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("OpenRouter API key not set.");
  return key;
}

function parseRevisedJson(text: string): DocumentAnalysis[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI returned an invalid document structure.");
  }
  return parsed as DocumentAnalysis[];
}

function injectAttachments(
  analyses: DocumentAnalysis[],
  attachments: SmartScanAttachment[],
): DocumentAnalysis[] {
  if (!attachments.length) return analyses;

  return analyses.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => {
      const idx = typeof block.attachmentIndex === "number" ? block.attachmentIndex : null;
      if (idx === null || idx < 0 || idx >= attachments.length) return block;
      const att = attachments[idx]!;
      return {
        ...block,
        type: block.type === "image_placeholder" ? block.type : "image_placeholder",
        embeddedImage: {
          base64: att.base64,
          mimeType: att.mimeType,
          widthRatio: 0.35,
        },
      };
    }),
  }));
}

async function reviseWithVision(
  analyses: DocumentAnalysis[],
  instruction: string,
  attachments: SmartScanAttachment[],
): Promise<{ revised: DocumentAnalysis[]; promptTokens: number; completionTokens: number; model: string }> {
  const apiKey = ensureApiKey();
  const attachmentList = attachments
    .map((a, i) => `${i}: ${a.name} (${a.mimeType})`)
    .join("\n");

  const prompt = `You are a document reconstruction editor for PDFTrusted Smart Scan AI.

The user attached reference images (logo, signature, stamp, etc.) and wants edits applied to their reconstructed document JSON.

Apply ONLY the changes the user requested. Preserve all other content unless explicitly asked to remove or reorder.

When placing an attached image, add a block with type "image_placeholder", set attachmentIndex to the attachment number (0-based), and text describing placement (e.g. "Company logo top right").

User instruction:
${instruction}

Attached files (reference by attachmentIndex):
${attachmentList}

Current document JSON:
${JSON.stringify(analyses)}

Return ONLY valid JSON — the same array structure with updated blocks. No markdown, no explanation.`;

  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: prompt }];

  for (const att of attachments) {
    contentParts.push({
      type: "image_url",
      image_url: { url: `data:${att.mimeType};base64,${att.base64}` },
    });
  }

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    signal: AbortSignal.timeout(120_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": OPENROUTER_APP_URL,
      "X-Title": OPENROUTER_APP_NAME,
    },
    body: JSON.stringify({
      model: REVISE_MODEL,
      messages: [{ role: "user", content: contentParts }],
      max_tokens: 8192,
      temperature: 0.15,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Vision revise failed (${res.status})`);
  }

  const data = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; model?: string };
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty AI response");

  let revised: DocumentAnalysis[];
  try {
    revised = parseRevisedJson(text);
  } catch {
    throw new Error("Could not parse AI revision — try a shorter, clearer instruction.");
  }

  revised = injectAttachments(revised, attachments);

  return {
    revised,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    model: data.usage?.model ?? REVISE_MODEL,
  };
}

export async function reviseSmartScanAnalyses(
  analyses: DocumentAnalysis[],
  instruction: string,
  attachments: SmartScanAttachment[] = [],
): Promise<{ revised: DocumentAnalysis[]; promptTokens: number; completionTokens: number; model: string }> {
  const trimmed = instruction.trim();
  if (!trimmed) throw new Error("instruction_required");

  const safeAttachments = attachments.filter(
    (a) => a.base64 && a.mimeType.startsWith("image/") && a.base64.length < 3_000_000,
  );

  if (safeAttachments.length > 0) {
    return reviseWithVision(analyses, trimmed, safeAttachments.slice(0, 3));
  }

  const prompt = `You are a document reconstruction editor for PDFTrusted Smart Scan AI.

The user has a reconstructed document represented as JSON (pages with typed blocks: title, heading, paragraph, table, etc.).

Apply ONLY the changes the user requested. Preserve all other content, order, and structure unless the user explicitly asks to remove or reorder.

User instruction:
${trimmed}

Current document JSON:
${JSON.stringify(analyses)}

Return ONLY valid JSON — the same array structure with updated blocks. No markdown, no explanation.`;

  const { text, usage } = await openRouterChatCompletion(REVISE_MODEL, prompt, 8192);

  let revised: DocumentAnalysis[];
  try {
    revised = parseRevisedJson(text);
  } catch {
    throw new Error("Could not parse AI revision — try a shorter, clearer instruction.");
  }

  return {
    revised,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    model: usage.model,
  };
}
