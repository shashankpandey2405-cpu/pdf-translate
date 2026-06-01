/**
 * Vision AI Document Analysis v2 — Multi-pass, multi-model, self-correcting
 * document reconstruction engine with near 100% accuracy.
 *
 * Pipeline:
 *   Pass 0  – Document classifier (cheap model, ~200 tokens)
 *   Pass 1  – Dual-model parallel analysis (Gemini + GPT-4o-mini)
 *   Pass 1B – Confidence retry with stronger model if < 0.7
 *   Pass 2  – Verification pass (image + extracted text → corrections)
 *   Merge   – Best-of-two merge + apply corrections
 */
import {
  OPENROUTER_API_KEY,
  OPENROUTER_APP_NAME,
  OPENROUTER_APP_URL,
} from "@/server/ai/config";
import { OpenRouterError, type OpenRouterUsage } from "@/server/ai/openrouter";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

// ---------------------------------------------------------------------------
// Model chains
// ---------------------------------------------------------------------------
const CLASSIFIER_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
];

const PRIMARY_MODEL = "google/gemini-2.5-flash";
const SECONDARY_MODEL = "openai/gpt-4o-mini";
const STRONG_MODEL = "openai/gpt-4o";
const VERIFY_MODEL = "openai/gpt-4o-mini";

/** Gate hallucinated insertions from the verification pass. */
const MIN_VERIFY_OVERALL_FOR_INSERT = 0.72;
const MIN_MISSING_BLOCK_CONFIDENCE = 0.78;
const MIN_MISSING_TEXT_LEN = 4;
const MIN_OVERALL_FOR_TEXT_FIX = 0.65;

const FALLBACK_MODELS = [
  "google/gemini-2.0-flash-001",
  "openai/gpt-4o",
  "deepseek/deepseek-chat",
];

// ---------------------------------------------------------------------------
// Block types (enhanced)
// ---------------------------------------------------------------------------
export type DocBlockType =
  | "title"
  | "heading"
  | "subheading"
  | "paragraph"
  | "list"
  | "numbered_list"
  | "table"
  | "image_placeholder"
  | "signature"
  | "footer"
  | "header"
  | "form_field"
  | "checkbox"
  | "page_number"
  | "caption"
  | "divider"
  | "address_block"
  | "date_field"
  | "amount_field"
  | "barcode_qr"
  | "stamp_seal"
  | "watermark_text"
  | "column_break";

export type DocBlock = {
  type: DocBlockType;
  text: string;
  level?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  alignment?: "left" | "center" | "right";
  fontSize?: "small" | "normal" | "large" | "xlarge";
  tableData?: string[][];
  listItems?: string[];
  checked?: boolean;
  language?: string;
  confidence?: number;
  /** 0-based index into attachments sent with a revise request */
  attachmentIndex?: number;
  /** Server-side injected image bytes for PDF reconstruction */
  embeddedImage?: {
    base64: string;
    mimeType: string;
    widthRatio?: number;
  };
};

export type DocumentAnalysis = {
  title: string;
  language: string;
  documentType: string;
  blocks: DocBlock[];
  pageOrientation: "portrait" | "landscape";
  confidence: number;
};

type ClassifierResult = {
  documentType: string;
  language: string;
  orientation: "portrait" | "landscape";
  hasHandwriting: boolean;
  hasTable: boolean;
  complexity: "simple" | "moderate" | "complex";
};

// ---------------------------------------------------------------------------
// Pass 0 — Document Classifier
// ---------------------------------------------------------------------------
const CLASSIFIER_PROMPT = `Look at this document image. Return ONLY a JSON object:
{
  "documentType": "invoice|letter|form|report|certificate|handwritten_notes|receipt|contract|id_card|table_heavy|mixed|other",
  "language": "primary language code (en, hi, ar, zh, es, fr, de, etc.)",
  "orientation": "portrait|landscape",
  "hasHandwriting": true/false,
  "hasTable": true/false,
  "complexity": "simple|moderate|complex"
}
Return ONLY JSON. No explanation.`;

async function classifyDocument(
  imageBase64: string,
  mimeType: string,
): Promise<ClassifierResult> {
  const apiKey = ensureApiKey();
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  for (const model of CLASSIFIER_MODELS) {
    try {
      console.info(`[vision-classify] trying ${model}`);
      const res = await callVisionModel(apiKey, model, CLASSIFIER_PROMPT, dataUrl, 256);
      if (!res) continue;

      const parsed = parseJsonResponse<ClassifierResult>(res.content);
      if (parsed?.documentType) {
        console.info(
          `[vision-classify] OK: type=${parsed.documentType} lang=${parsed.language} ` +
          `handwriting=${parsed.hasHandwriting} table=${parsed.hasTable} complexity=${parsed.complexity}`,
        );
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return {
    documentType: "other",
    language: "en",
    orientation: "portrait",
    hasHandwriting: false,
    hasTable: false,
    complexity: "moderate",
  };
}

// ---------------------------------------------------------------------------
// Specialized Prompts per Document Type
// ---------------------------------------------------------------------------
function buildSpecializedPrompt(classification: ClassifierResult, qualityHint?: string): string {
  const qualityNote = qualityHint
    ? `\nIMAGE QUALITY NOTE: ${qualityHint}. Take extra care reading text.\n`
    : "";

  const baseRules = `${qualityNote}
Return a JSON object with this exact structure:
{
  "title": "document title or empty string",
  "language": "${classification.language}",
  "documentType": "${classification.documentType}",
  "pageOrientation": "${classification.orientation}",
  "confidence": 0.0 to 1.0,
  "blocks": [
    {
      "type": "title|heading|subheading|paragraph|list|numbered_list|table|image_placeholder|signature|footer|header|form_field|checkbox|page_number|caption|divider|address_block|date_field|amount_field|barcode_qr|stamp_seal|watermark_text|column_break",
      "text": "the text content",
      "level": 1-3 (headings only),
      "bold": true/false,
      "italic": true/false,
      "underline": true/false,
      "alignment": "left|center|right",
      "fontSize": "small|normal|large|xlarge",
      "tableData": [["r1c1","r1c2"],["r2c1","r2c2"]] (tables only),
      "listItems": ["item1","item2"] (lists only),
      "checked": true/false (checkboxes only),
      "confidence": 0.0 to 1.0 (per-block confidence)
    }
  ]
}

ABSOLUTE RULES — NEVER VIOLATE:
1. Extract EVERY SINGLE piece of text. Missing even one word is a failure.
2. Preserve exact reading order (top→bottom, left→right, column by column).
3. Tables: extract ALL rows and ALL columns. Count carefully.
4. Return ONLY valid JSON. No markdown, no explanation, no code fences.
5. For multi-column layouts, add "column_break" between columns.
6. Mark addresses as "address_block", dates as "date_field", money as "amount_field".
7. Distinguish numbered lists ("numbered_list") from bullet lists ("list").
8. Set confidence per block — lower for blurry/uncertain text.`;

  const docType = classification.documentType;

  if (docType === "invoice" || docType === "receipt") {
    return `You are a world-class invoice/receipt analysis AI.
${baseRules}

INVOICE/RECEIPT SPECIFIC RULES:
- Extract vendor/company name as "title"
- Extract "Invoice No", "Date", "Due Date" as "date_field" blocks
- Extract customer/billing address as "address_block"
- Extract line items table with columns: Description, Qty, Rate, Amount
- Extract subtotal, tax, discount, total as "amount_field" (bold the total)
- Extract payment terms, bank details as paragraphs
- Extract any stamp/seal as "stamp_seal"
- NEVER miss a line item or amount — count all rows carefully`;
  }

  if (docType === "form") {
    return `You are a world-class form analysis AI.
${baseRules}

FORM SPECIFIC RULES:
- Extract every label + value pair as "form_field" (text = "Label: Value")
- Checkboxes: use "checkbox" with checked=true/false for EVERY checkbox
- Radio buttons: treat like checkboxes
- Signatures: mark as "signature"
- Empty fields: include them with text = "Label: [blank]"
- Group related fields together in reading order
- Extract form title and section headers as headings`;
  }

  if (docType === "table_heavy") {
    return `You are a world-class table extraction AI.
${baseRules}

TABLE SPECIFIC RULES:
- This document is primarily tables. Extract every table with PERFECT accuracy.
- Count columns by looking at the header row first
- Verify row count by scanning the entire table top to bottom
- Each cell must be in the correct column — alignment matters
- Empty cells should be "" not omitted
- Multi-line cells: join with " " into one cell value
- Extract any text above/below tables as paragraphs
- If a table spans multiple sections, keep it as one table`;
  }

  if (docType === "handwritten_notes") {
    return `You are a world-class handwriting recognition AI.
${baseRules}

HANDWRITING SPECIFIC RULES:
- Read handwritten text character by character with extreme care
- For uncertain words, add [?] after: "possibly [?]"
- Preserve paragraph breaks as the writer intended
- Detect numbered items vs plain paragraphs
- Underlined words: set underline=true
- Crossed-out text: skip it
- Drawings/diagrams: mark as "image_placeholder" with description
- Maintain original indentation structure`;
  }

  if (docType === "certificate" || docType === "id_card") {
    return `You are a world-class certificate/ID card analysis AI.
${baseRules}

CERTIFICATE/ID SPECIFIC RULES:
- Extract the certificate/card title prominently (centered, large)
- Name of the person: extract as heading, bold
- All dates: use "date_field"
- ID numbers, registration numbers: extract exactly (every digit matters)
- Photo area: mark as "image_placeholder"
- Official stamps/seals: mark as "stamp_seal"
- Signatures: mark as "signature"
- Issuing authority: extract as paragraph
- Barcodes/QR codes: mark as "barcode_qr"`;
  }

  if (docType === "contract" || docType === "letter") {
    return `You are a world-class legal document analysis AI.
${baseRules}

LEGAL/LETTER SPECIFIC RULES:
- Extract letterhead/sender info at top as "header" or "address_block"
- Date: use "date_field"
- Recipient address: use "address_block"
- Subject line: extract as "heading" (bold)
- Body paragraphs: preserve every word exactly
- Numbered clauses: use "numbered_list"
- Signature blocks: "signature" with name below
- Reference numbers: extract precisely
- CC/enclosure lines: extract as "footer"`;
  }

  if (docType === "report") {
    return `You are a world-class report analysis AI.
${baseRules}

REPORT SPECIFIC RULES:
- Extract report title as "title" (centered, large)
- Section headings: use proper heading levels (1, 2, 3)
- Charts/graphs: mark as "image_placeholder" with description
- Data tables: extract with full precision
- Footnotes: extract as "caption" blocks
- Page numbers: extract as "page_number"
- Executive summary: mark first section clearly
- Bullet points and numbered lists: differentiate correctly`;
  }

  return `You are a world-class document analysis AI with near-perfect accuracy.
${baseRules}

GENERAL RULES:
- Analyze the entire document structure before extracting
- Use the most specific block type for each element
- Pay special attention to: headers, footers, page numbers
- For logos/images: describe what you see in the placeholder text
- Stamps/seals: mark as "stamp_seal" with description
- Watermark text: extract as "watermark_text"`;
}

// ---------------------------------------------------------------------------
// Pass 1 — Dual-Model Analysis
// ---------------------------------------------------------------------------
async function dualModelAnalysis(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  isPremium: boolean,
): Promise<{ analysis: DocumentAnalysis; usage: OpenRouterUsage }> {
  const apiKey = ensureApiKey();
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  if (isPremium) {
    const [primaryResult, secondaryResult] = await Promise.allSettled([
      runAnalysisModel(apiKey, PRIMARY_MODEL, prompt, dataUrl),
      runAnalysisModel(apiKey, SECONDARY_MODEL, prompt, dataUrl),
    ]);

    const primary = primaryResult.status === "fulfilled" ? primaryResult.value : null;
    const secondary = secondaryResult.status === "fulfilled" ? secondaryResult.value : null;

    if (primary && secondary) {
      console.info(
        `[vision-dual] both models succeeded: primary=${primary.analysis.blocks.length} blocks (conf=${primary.analysis.confidence}), ` +
        `secondary=${secondary.analysis.blocks.length} blocks (conf=${secondary.analysis.confidence})`,
      );
      const merged = mergeAnalyses(primary.analysis, secondary.analysis);
      const totalUsage: OpenRouterUsage = {
        promptTokens: primary.usage.promptTokens + secondary.usage.promptTokens,
        completionTokens: primary.usage.completionTokens + secondary.usage.completionTokens,
        model: `${primary.usage.model}+${secondary.usage.model}`,
      };
      return { analysis: merged, usage: totalUsage };
    }

    const single = primary ?? secondary;
    if (single) {
      console.info(`[vision-dual] one model succeeded: ${single.usage.model}`);
      return single;
    }
  } else {
    const result = await runAnalysisModel(apiKey, PRIMARY_MODEL, prompt, dataUrl);
    if (result) return result;
  }

  for (const model of FALLBACK_MODELS) {
    try {
      const result = await runAnalysisModel(apiKey, model, prompt, dataUrl);
      if (result) return result;
    } catch {
      continue;
    }
  }

  throw new OpenRouterError("vision_all_models_failed", "All vision models failed.");
}

function mergeAnalyses(a: DocumentAnalysis, b: DocumentAnalysis): DocumentAnalysis {
  const primary = a.confidence >= b.confidence ? a : b;
  const secondary = a.confidence >= b.confidence ? b : a;

  const mergedBlocks: DocBlock[] = [];
  const maxLen = Math.max(primary.blocks.length, secondary.blocks.length);

  for (let i = 0; i < maxLen; i++) {
    const pBlock = primary.blocks[i];
    const sBlock = secondary.blocks[i];

    if (!pBlock) { if (sBlock) mergedBlocks.push(sBlock); continue; }
    if (!sBlock) { mergedBlocks.push(pBlock); continue; }

    if (pBlock.type === "table" && sBlock.type === "table") {
      const pRows = pBlock.tableData?.length ?? 0;
      const sRows = sBlock.tableData?.length ?? 0;
      const pCols = pBlock.tableData?.[0]?.length ?? 0;
      const sCols = sBlock.tableData?.[0]?.length ?? 0;
      mergedBlocks.push((pRows * pCols) >= (sRows * sCols) ? pBlock : sBlock);
    } else {
      const pLen = (pBlock.text?.length ?? 0) + (pBlock.listItems?.join("").length ?? 0);
      const sLen = (sBlock.text?.length ?? 0) + (sBlock.listItems?.join("").length ?? 0);
      mergedBlocks.push(pLen >= sLen ? pBlock : sBlock);
    }
  }

  return {
    ...primary,
    blocks: mergedBlocks,
    confidence: Math.max(primary.confidence, secondary.confidence),
  };
}

// ---------------------------------------------------------------------------
// Pass 1B — Confidence Retry
// ---------------------------------------------------------------------------
async function confidenceRetry(
  current: { analysis: DocumentAnalysis; usage: OpenRouterUsage },
  imageBase64: string,
  mimeType: string,
  prompt: string,
): Promise<{ analysis: DocumentAnalysis; usage: OpenRouterUsage }> {
  if (current.analysis.confidence >= 0.7) return current;

  console.info(`[vision-retry] confidence=${current.analysis.confidence} < 0.7, retrying with stronger model`);
  const apiKey = ensureApiKey();
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  try {
    const strong = await runAnalysisModel(apiKey, STRONG_MODEL, prompt, dataUrl);
    if (strong && strong.analysis.confidence > current.analysis.confidence) {
      console.info(`[vision-retry] stronger model improved confidence to ${strong.analysis.confidence}`);
      const merged = mergeAnalyses(strong.analysis, current.analysis);
      return {
        analysis: merged,
        usage: {
          promptTokens: current.usage.promptTokens + strong.usage.promptTokens,
          completionTokens: current.usage.completionTokens + strong.usage.completionTokens,
          model: `${current.usage.model}+${strong.usage.model}`,
        },
      };
    }
  } catch (e) {
    console.warn(`[vision-retry] strong model failed:`, e instanceof Error ? e.message : e);
  }

  return current;
}

// ---------------------------------------------------------------------------
// Pass 2 — Verification
// ---------------------------------------------------------------------------
async function verifyAnalysis(
  analysis: DocumentAnalysis,
  usage: OpenRouterUsage,
  imageBase64: string,
  mimeType: string,
): Promise<{ analysis: DocumentAnalysis; usage: OpenRouterUsage }> {
  const apiKey = ensureApiKey();
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const extractedText = analysis.blocks
    .map((b, i) => {
      if (b.type === "table") {
        const rows = b.tableData?.map((r) => r.join(" | ")).join("\n") ?? "";
        return `[${i}:${b.type}]\n${rows}`;
      }
      if (b.type === "list" || b.type === "numbered_list") {
        return `[${i}:${b.type}]\n${(b.listItems ?? [b.text]).join("\n")}`;
      }
      return `[${i}:${b.type}] ${b.text}`;
    })
    .join("\n");

  const verifyPrompt = `You are a document verification AI. Compare the extracted text below with the original document image.

EXTRACTED TEXT:
${extractedText.slice(0, 6000)}

TASKS:
1. Check for MISSING text — any text visible in the image but not in the extraction
2. Check for WRONG reading order — blocks that are out of sequence
3. Check for INCORRECT table data — wrong cell values, missing rows/columns
4. Check for MISIDENTIFIED elements — e.g., a heading marked as paragraph

Return a JSON object:
{
  "corrections": [
    {
      "blockIndex": 3,
      "issue": "missing_text|wrong_order|wrong_type|wrong_content|missing_block",
      "correctedText": "the correct text",
      "correctedType": "correct block type if misidentified",
      "insertAfterIndex": -1 (for missing_block: insert after this index, -1 for beginning)
    }
  ],
  "missingBlocks": [
    {
      "type": "paragraph",
      "text": "text that was completely missed",
      "insertAfterIndex": 5,
      "confidence": 0.0 to 1.0
    }
  ],
  "overallAccuracy": 0.0 to 1.0
}
Return ONLY JSON.`;

  try {
    const res = await callVisionModel(apiKey, VERIFY_MODEL, verifyPrompt, dataUrl, 3072);
    if (!res) return { analysis, usage };

    const corrections = parseJsonResponse<{
      corrections?: Array<{
        blockIndex?: number;
        correctedText?: string;
        correctedType?: string;
        issue?: string;
      }>;
      missingBlocks?: Array<{
        type?: string;
        text?: string;
        insertAfterIndex?: number;
        confidence?: number;
      }>;
      overallAccuracy?: number;
    }>(res.content);

    if (!corrections) return { analysis, usage };

    const fixed = { ...analysis, blocks: [...analysis.blocks] };

    const overallAccuracy = corrections.overallAccuracy ?? 0;

    if (corrections.corrections?.length && overallAccuracy >= MIN_OVERALL_FOR_TEXT_FIX) {
      for (const c of corrections.corrections) {
        if (typeof c.blockIndex !== "number" || c.blockIndex >= fixed.blocks.length) continue;
        const block = fixed.blocks[c.blockIndex];
        if (c.correctedText && c.correctedText.length > block.text.length) {
          fixed.blocks[c.blockIndex] = { ...block, text: c.correctedText };
        }
        if (c.correctedType && c.issue === "wrong_type") {
          fixed.blocks[c.blockIndex] = { ...block, type: c.correctedType as DocBlockType };
        }
      }
    }

    if (
      corrections.missingBlocks?.length &&
      overallAccuracy >= MIN_VERIFY_OVERALL_FOR_INSERT
    ) {
      const toInsert = corrections.missingBlocks
        .filter((mb) => {
          if (!mb.text?.trim() || !mb.type) return false;
          if (mb.text.trim().length < MIN_MISSING_TEXT_LEN) return false;
          const blockConfidence = mb.confidence ?? overallAccuracy;
          return blockConfidence >= MIN_MISSING_BLOCK_CONFIDENCE;
        })
        .map((mb) => ({
          block: { type: mb.type as DocBlockType, text: mb.text!.trim() } as DocBlock,
          after: mb.insertAfterIndex ?? fixed.blocks.length - 1,
        }));

      toInsert.sort((a, b) => b.after - a.after);
      for (const { block, after } of toInsert) {
        fixed.blocks.splice(Math.min(after + 1, fixed.blocks.length), 0, block);
      }
    }

    if (corrections.overallAccuracy) {
      fixed.confidence = Math.max(fixed.confidence, corrections.overallAccuracy);
    }

    const verifyUsage: OpenRouterUsage = {
      promptTokens: usage.promptTokens + (res.usage?.prompt_tokens ?? 0),
      completionTokens: usage.completionTokens + (res.usage?.completion_tokens ?? 0),
      model: `${usage.model}+verify:${VERIFY_MODEL}`,
    };

    console.info(
      `[vision-verify] applied ${corrections.corrections?.length ?? 0} corrections, ` +
      `${corrections.missingBlocks?.length ?? 0} missing blocks, accuracy=${corrections.overallAccuracy}`,
    );

    return { analysis: fixed, usage: verifyUsage };
  } catch (e) {
    console.warn(`[vision-verify] verification failed:`, e instanceof Error ? e.message : e);
    return { analysis, usage };
  }
}

// ---------------------------------------------------------------------------
// Public API — Full Pipeline
// ---------------------------------------------------------------------------
export async function analyzeDocumentImage(
  imageBase64: string,
  mimeType: string,
  opts?: { isPremium?: boolean; pageNum?: number; qualityHint?: string },
): Promise<{ analysis: DocumentAnalysis; usage: OpenRouterUsage }> {
  const isPremium = opts?.isPremium ?? false;
  const pageNum = opts?.pageNum ?? 1;

  console.info(`[vision-ai] starting multi-pass analysis for page ${pageNum} (premium=${isPremium})`);

  // Pass 0: Classify
  const classification = await classifyDocument(imageBase64, mimeType);

  // Build specialized prompt
  const prompt = buildSpecializedPrompt(classification, opts?.qualityHint);

  // Pass 1: Dual-model analysis (parallel for premium, single for free)
  let result = await dualModelAnalysis(imageBase64, mimeType, prompt, isPremium);
  console.info(
    `[vision-ai] pass1 done: ${result.analysis.blocks.length} blocks, confidence=${result.analysis.confidence}`,
  );

  // Pass 1B: Confidence retry
  if (isPremium) {
    result = await confidenceRetry(result, imageBase64, mimeType, prompt);
  }

  // Pass 2: Verification (premium only)
  if (isPremium && result.analysis.blocks.length > 0) {
    result = await verifyAnalysis(result.analysis, result.usage, imageBase64, mimeType);
    console.info(
      `[vision-ai] pass2 verify done: ${result.analysis.blocks.length} blocks, confidence=${result.analysis.confidence}`,
    );
  }

  return result;
}

export async function analyzeMultiplePages(
  pages: Array<{ imageBase64: string; mimeType: string }>,
  opts?: { isPremium?: boolean; qualityHint?: string },
): Promise<{ analyses: DocumentAnalysis[]; totalUsage: OpenRouterUsage }> {
  const analyses: DocumentAnalysis[] = [];
  let totalPrompt = 0;
  let totalCompletion = 0;
  let lastModel = "";

  for (let i = 0; i < pages.length; i++) {
    const { analysis, usage } = await analyzeDocumentImage(
      pages[i].imageBase64,
      pages[i].mimeType,
      { isPremium: opts?.isPremium, pageNum: i + 1, qualityHint: opts?.qualityHint },
    );
    analyses.push(analysis);
    totalPrompt += usage.promptTokens;
    totalCompletion += usage.completionTokens;
    lastModel = usage.model;
  }

  return {
    analyses,
    totalUsage: { promptTokens: totalPrompt, completionTokens: totalCompletion, model: lastModel },
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function ensureApiKey(): string {
  const key = OPENROUTER_API_KEY?.trim();
  if (!key) throw new OpenRouterError("ai_not_configured", "OpenRouter API key not set.");
  return key;
}

type VisionCallResult = {
  content: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
} | null;

async function callVisionModel(
  apiKey: string,
  model: string,
  textPrompt: string,
  imageDataUrl: string,
  maxTokens: number,
): Promise<VisionCallResult> {
  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    signal: AbortSignal.timeout(90_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": OPENROUTER_APP_URL,
      "X-Title": OPENROUTER_APP_NAME,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: textPrompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.1,
    }),
  });

  const raw = await res.text();
  let data: unknown;
  try { data = JSON.parse(raw); } catch { data = null; }

  if (!res.ok) {
    const errMsg = typeof data === "object" && data && "error" in data
      ? ((data as { error?: { message?: string } }).error?.message ?? raw.slice(0, 200))
      : raw.slice(0, 200);
    console.warn(`[vision-call] ${model} HTTP ${res.status}: ${errMsg.slice(0, 150)}`);
    return null;
  }

  const root = data as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = root.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  return { content, usage: root.usage };
}

async function runAnalysisModel(
  apiKey: string,
  model: string,
  prompt: string,
  imageDataUrl: string,
): Promise<{ analysis: DocumentAnalysis; usage: OpenRouterUsage } | null> {
  console.info(`[vision-analyze] trying ${model}`);

  const res = await callVisionModel(apiKey, model, prompt, imageDataUrl, 8192);
  if (!res) return null;

  const analysis = parseJsonResponse<DocumentAnalysis>(res.content);
  if (!analysis?.blocks || !Array.isArray(analysis.blocks) || analysis.blocks.length === 0) {
    console.warn(`[vision-analyze] ${model} returned no valid blocks`);
    return null;
  }

  if (typeof analysis.confidence !== "number") analysis.confidence = 0.5;
  if (!analysis.language) analysis.language = "en";
  if (!analysis.documentType) analysis.documentType = "other";
  if (!analysis.pageOrientation) analysis.pageOrientation = "portrait";

  const usage: OpenRouterUsage = {
    promptTokens: res.usage?.prompt_tokens ?? 0,
    completionTokens: res.usage?.completion_tokens ?? 0,
    model,
  };

  console.info(
    `[vision-analyze] ${model} OK: blocks=${analysis.blocks.length} conf=${analysis.confidence} ` +
    `in=${usage.promptTokens} out=${usage.completionTokens}`,
  );

  return { analysis, usage };
}

function parseJsonResponse<T>(content: string): T | null {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]) as T; } catch { /* */ }
    }
    return null;
  }
}
