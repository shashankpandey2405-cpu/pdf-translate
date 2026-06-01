/**
 * Conversion-optimized sign-in strings (EN defaults).
 * React UI should prefer `conversion.signIn.*` i18n keys; use these in hooks/server fallbacks.
 */
export const SIGN_IN_REASON = {
  cloudTurbo:
    "Your file is ready on this device. Continue with Google to run Turbo Cloud — 10 free credits/month.",
  cloudWithUpload:
    "Your upload is saved. One tap with Google unlocks Turbo Cloud (+ 10 credits/month).",
  aiSummarize:
    "Almost there — continue with Google to summarize with AI (10 free credits/month).",
  aiChat: "Continue with Google to start chatting with your PDF (+ 10 free credits/month).",
  aiChatImage: "Continue with Google to chat with your document (+ 10 free credits/month).",
  aiGeneric: "Continue with Google to unlock AI tools — 10 credits/month, no credit card.",
  ocr: "Continue with Google to run Turbo Cloud OCR (+ 10 free credits/month).",
  translate:
    "Your file is ready. Continue with Google for Turbo Cloud translation (+ 10 credits/month).",
  compressCloud:
    "Continue with Google for Turbo Cloud compression — better quality, 10 credits/month.",
  pdfToWord: "Continue with Google for high-fidelity PDF to Word (+ 10 credits/month).",
  genericCapacity:
    "Continue with Google for larger files, saved history & 10 free credits/month.",
  smartScan: "Continue with Google to run Smart Scan AI (+ 10 free credits/month).",
  questionGen:
    "Continue with Google to generate questions from your PDF (+ 10 free credits/month).",
} as const;

export type SignInTone = "default" | "result" | "cloud" | "ai";
