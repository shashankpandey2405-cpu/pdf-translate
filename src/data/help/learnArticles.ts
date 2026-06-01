import type { ToolFaq } from "@/data/seo/toolSeoBundles";
import type { LearnTopicSlug } from "@/data/help/helpCenterRegistry";

export type LearnArticle = {
  slug: LearnTopicSlug;
  title: string;
  description: string;
  sections: { heading: string; paragraphs: string[] }[];
  faqs: ToolFaq[];
  relatedTools?: { slug: string; label: string }[];
};

export const LEARN_ARTICLES: Record<LearnTopicSlug, LearnArticle> = {
  "about-pdftrusted": {
    slug: "about-pdftrusted",
    title: "About PDFTrusted",
    description:
      "PDFTrusted is a free online PDF platform combining browser-based processing for privacy with optional cloud engines for OCR, office conversion, and AI.",
    sections: [
      {
        heading: "What we offer",
        paragraphs: [
          "PDFTrusted provides merge, split, compress, edit, sign, convert, OCR, and AI document tools in one web app. Core operations run locally in your browser when file size and complexity allow.",
          "Advanced workflows — scanned OCR, PDF to Word, Word to PDF, translation, and Smart Scan — use secure cloud workers with automatic output expiry.",
        ],
      },
      {
        heading: "Who it is for",
        paragraphs: [
          "Students, professionals, and teams who need fast PDF tasks without installing desktop software. No account is required for many browser tools.",
        ],
      },
    ],
    faqs: [
      { question: "Is PDFTrusted free?", answer: "Core browser tools are free. Cloud and AI features have daily limits; premium extends caps." },
      { question: "Where is PDFTrusted based?", answer: "PDFTrusted operates as a global web service with infrastructure on Vercel, Cloudflare R2, and Railway workers." },
    ],
    relatedTools: [{ slug: "merge-pdf", label: "Merge PDF" }, { slug: "compress-pdf", label: "Compress PDF" }],
  },
  security: {
    slug: "security",
    title: "PDFTrusted Security",
    description: "How PDFTrusted protects uploads, worker callbacks, and cloud outputs.",
    sections: [
      {
        heading: "Transport and storage",
        paragraphs: [
          "HTTPS is enforced for all traffic. Cloud uploads use presigned URLs scoped to your job. Worker completion callbacks are HMAC-signed.",
          "Outputs in cloud mode are stored in private object storage with time-limited access and user-initiated purge options.",
        ],
      },
      {
        heading: "Browser-first processing",
        paragraphs: [
          "When a tool runs in browser mode, file bytes stay on your device for the processing step — ideal for sensitive drafts.",
        ],
      },
    ],
    faqs: [
      { question: "Are cloud files encrypted?", answer: "Files are stored in private buckets with access via signed URLs; TLS protects data in transit." },
      { question: "Who can access my cloud job?", answer: "Only your session and signed worker callbacks can complete or download a job tied to your account or guest session." },
    ],
    relatedTools: [{ slug: "protect-pdf", label: "Protect PDF" }, { slug: "unlock-pdf", label: "Unlock PDF" }],
  },
  privacy: {
    slug: "privacy",
    title: "PDFTrusted Privacy",
    description: "Data minimization, retention, and your controls on PDFTrusted.",
    sections: [
      {
        heading: "Local vs cloud",
        paragraphs: [
          "Browser tools minimize server contact. Cloud tools require upload for processing; retention policies apply to staged inputs and outputs.",
          "See the Privacy Center and Cookie Policy for subprocessors, analytics, and regional notes.",
        ],
      },
    ],
    faqs: [
      { question: "How long are cloud files kept?", answer: "Outputs expire automatically; you can delete sooner from your job history when signed in." },
      { question: "Do you sell my documents?", answer: "No. Documents are processed to deliver the service, not for advertising profiles." },
    ],
  },
  "browser-processing": {
    slug: "browser-processing",
    title: "Browser PDF processing",
    description: "How PDFTrusted runs merge, split, rotate, and similar tools locally in your browser.",
    sections: [
      {
        heading: "Technology",
        paragraphs: [
          "PDFTrusted uses pdf-lib and pdf.js in the browser, optionally backed by Web Workers for heavy tasks. This keeps latency low and avoids unnecessary uploads.",
        ],
      },
      {
        heading: "Limits",
        paragraphs: [
          "Very large files, scanned compression, or strong encryption may require cloud mode for quality or compatibility.",
        ],
      },
    ],
    faqs: [
      { question: "Which tools are browser-only?", answer: "Merge, split, rotate, extract, delete pages, and many edits run locally when within size limits." },
    ],
    relatedTools: [{ slug: "merge-pdf", label: "Merge PDF" }, { slug: "split-pdf", label: "Split PDF" }],
  },
  "cloud-processing": {
    slug: "cloud-processing",
    title: "Cloud PDF processing",
    description: "Railway worker pools for OCR, office conversion, compression, and security tools.",
    sections: [
      {
        heading: "Pipeline",
        paragraphs: [
          "Jobs enqueue to Redis, workers on Railway pull tasks, write outputs to R2, and callback to PDFTrusted to mark jobs complete.",
          "Pools include OCR, docx, office, compress, convert, security, and excel specialization.",
        ],
      },
    ],
    faqs: [
      { question: "Why use cloud mode?", answer: "Better OCR, Office fidelity, qpdf encryption, and Ghostscript compression for scans." },
    ],
    relatedTools: [{ slug: "ocr-pdf", label: "OCR PDF" }, { slug: "pdf-to-word", label: "PDF to Word" }],
  },
  "ai-features": {
    slug: "ai-features",
    title: "AI document features",
    description: "Summarize, chat, translate, Smart Scan, and question generation powered by OpenRouter.",
    sections: [
      {
        heading: "Capabilities",
        paragraphs: [
          "AI tools extract text or vision-analyze pages, then call frontier models via OpenRouter. Credits and trials gate heavy usage.",
          "Smart Scan reconstructs editable PDFs from photos or scans using vision + layout pipelines.",
        ],
      },
    ],
    faqs: [
      { question: "Do AI tools upload my PDF?", answer: "Yes — cloud AI requires upload for analysis; follow credit and retention rules in your account." },
    ],
    relatedTools: [{ slug: "ai-summarize", label: "Summarize PDF" }, { slug: "smart-scan-ai", label: "Smart Scan AI" }],
  },
  "ocr-technology": {
    slug: "ocr-technology",
    title: "OCR technology",
    description: "OCRmyPDF, Tesseract, and optional Paddle paths for searchable PDFs.",
    sections: [
      {
        heading: "Engines",
        paragraphs: [
          "The OCR worker pool runs OCRmyPDF with Tesseract languages. Ultra modes may use Paddle OCR with preprocessing for difficult scans.",
          "Deskew, oversampling, and iOS-friendly output settings improve mobile readability.",
        ],
      },
    ],
    faqs: [
      { question: "Which languages are supported?", answer: "Dozens of Tesseract languages; pick the closest match in the OCR tool options." },
    ],
    relatedTools: [{ slug: "ocr-pdf", label: "OCR PDF" }],
  },
  "translation-technology": {
    slug: "translation-technology",
    title: "PDF translation technology",
    description: "AI translation pipeline for PDF documents with layout-aware output.",
    sections: [
      {
        heading: "Workflow",
        paragraphs: [
          "Translate PDF uploads the document, extracts text per page, translates via AI models, and can rebuild a PDF with translated content.",
          "Scanned PDFs may require OCR cloud preflight for best results.",
        ],
      },
    ],
    faqs: [
      { question: "Does translation preserve layout?", answer: "Digital PDFs translate more faithfully; complex scans may need OCR first." },
    ],
    relatedTools: [{ slug: "translate-pdf", label: "Translate PDF" }],
  },
};

export function getLearnArticle(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES[slug as LearnTopicSlug];
}
