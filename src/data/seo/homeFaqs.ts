/** Home FAQ copy — single source for UI keys and FAQPage JSON-LD (EN). */
export type HomeFaqEntry = {
  key: string;
  question: string;
  answer: string;
};

export const HOME_FAQ_ENTRIES: HomeFaqEntry[] = [
  {
    key: "privacy",
    question: "Do you store my PDFs?",
    answer:
      "Browser tools often never upload your file. Turbo Cloud jobs use temporary encrypted storage that is deleted per our retention policy—not sold or used for AI training.",
  },
  {
    key: "compression",
    question: "How much can PDF compression reduce file size?",
    answer:
      "Results vary by PDF content. Many files shrink noticeably; image-heavy PDFs may see up to roughly 90% smaller files, but quality and readability depend on your settings and source file.",
  },
  {
    key: "conversion",
    question: "Can I convert PDF to Word or images online?",
    answer:
      "Yes. PDF to Word and image conversions are available in browser or Turbo Cloud mode. Complex layouts may need light cleanup after export. Cloud conversion requires sign-in for fair usage limits.",
  },
  {
    key: "aiTools",
    question: "What do AI PDF tools do?",
    answer:
      "Chat with PDF, summarization, and translation use secure Turbo Cloud processing. They help you understand documents faster; they do not replace legal or professional review.",
  },
  {
    key: "cloud",
    question: "What is Turbo Cloud processing?",
    answer:
      "Turbo Cloud runs OCR, PDF to Word, heavy compression, and AI on secure workers after an encrypted upload. Staging files auto-delete; usage is billed by what you run (pay-for-use model coming with Premium).",
  },
  {
    key: "ocr",
    question: "How good is OCR?",
    answer:
      "Accuracy depends on scan quality, contrast, and language. Clean, straight scans usually work best.",
  },
  {
    key: "mobile",
    question: "Do PDF tools work on iPhone and Android?",
    answer:
      "Yes. PDFTrusted is optimized for mobile Safari and Chrome. Lightweight tasks run in-browser; large files can use Turbo Cloud so low-memory phones stay stable. Add to home screen as a PWA for quick access.",
  },
  {
    key: "browser",
    question: "Which browsers are supported?",
    answer:
      "Recent versions of Chrome, Edge, Firefox, and Safari are supported. Enable JavaScript and allow downloads for your browser.",
  },
  {
    key: "quality",
    question: "Will compression or conversion reduce quality?",
    answer:
      "Compression trades size for fidelity depending on the mode you choose. Conversions aim to preserve layout but complex PDFs may shift spacing or fonts slightly.",
  },
  {
    key: "limits",
    question: "What are upload and file size limits?",
    answer:
      "Browser limits adapt to your device for stability. Turbo Cloud accepts larger files when signed in. See each tool page for current caps — limits update automatically by device and usage.",
  },
];

export const HOME_FAQ_KEYS = HOME_FAQ_ENTRIES.map((e) => e.key);

export function getHomeFaqsForSchema(): Array<{ question: string; answer: string }> {
  return HOME_FAQ_ENTRIES.map(({ question, answer }) => ({ question, answer }));
}
