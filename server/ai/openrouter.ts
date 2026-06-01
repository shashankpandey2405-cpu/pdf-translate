import {
  OPENROUTER_API_KEY,
  OPENROUTER_APP_NAME,
  OPENROUTER_APP_URL,
} from "@/server/ai/config";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterUsage = {
  promptTokens: number;
  completionTokens: number;
  model: string;
};

export class OpenRouterError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly model?: string;

  constructor(code: string, message: string, opts?: { status?: number; model?: string }) {
    super(message);
    this.name = "OpenRouterError";
    this.code = code;
    this.status = opts?.status;
    this.model = opts?.model;
  }
}

function ensureApiKey(): string {
  const key = OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new OpenRouterError(
      "ai_not_configured",
      "OpenRouter is not configured. Set OPENROUTER_API_KEY on the server.",
    );
  }
  return key;
}

function isRetryableError(err: OpenRouterError): boolean {
  if (err.code === "openrouter_rate_limited" || err.code === "openrouter_upstream_error") {
    return true;
  }
  if (err.status && (err.status === 429 || err.status >= 500)) return true;
  if (err.code === "openrouter_request_failed") return true;
  if (err.code === "openrouter_bad_response") return true;
  if (err.code === "openrouter_model_not_found") return true;
  if (err.status === 404) return true;
  return false;
}

export function isOpenRouterRetryable(err: unknown): boolean {
  return err instanceof OpenRouterError && isRetryableError(err);
}

export async function openRouterChatCompletion(
  model: string,
  prompt: string,
  maxTokens: number,
): Promise<{ text: string; usage: OpenRouterUsage }> {
  const apiKey = ensureApiKey();

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
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.2,
    }),
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errObj =
      typeof data === "object" && data && "error" in data
        ? (data as { error?: { message?: string; code?: string | number } }).error
        : null;
    const msg = errObj?.message ?? raw.slice(0, 400) ?? `HTTP ${res.status}`;
    console.error(`[openrouter] ${model} HTTP ${res.status}: ${msg.slice(0, 300)}`);
    if (res.status === 429 || /rate limit|quota/i.test(msg)) {
      throw new OpenRouterError("openrouter_rate_limited", msg, { status: res.status, model });
    }
    if (res.status >= 500) {
      throw new OpenRouterError("openrouter_upstream_error", msg, { status: res.status, model });
    }
    if (res.status === 404 || /no endpoints|not found/i.test(msg)) {
      throw new OpenRouterError("openrouter_model_not_found", `Model ${model} not found: ${msg}`, { status: res.status, model });
    }
    if (res.status === 402 || /credit|balance|insufficient/i.test(msg)) {
      throw new OpenRouterError("openrouter_insufficient_credits", msg, { status: res.status, model });
    }
    throw new OpenRouterError("openrouter_request_failed", msg, { status: res.status, model });
  }

  const root = data as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const choice = root.choices?.[0];
  const finish = choice?.finish_reason;
  if (finish === "content_filter") {
    throw new OpenRouterError(
      "openrouter_blocked",
      "The model blocked this content. Try a different PDF or language pair.",
      { model },
    );
  }

  const content = choice?.message?.content?.trim();
  if (!content) {
    throw new OpenRouterError("openrouter_bad_response", "Empty response from OpenRouter.", { model });
  }

  return {
    text: content,
    usage: {
      promptTokens: root.usage?.prompt_tokens ?? 0,
      completionTokens: root.usage?.completion_tokens ?? 0,
      model,
    },
  };
}
