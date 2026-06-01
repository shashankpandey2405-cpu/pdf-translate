import type { ToolFaq } from "@/data/seo/toolSeoBundles";

export type CompareFeatureRow = {
  feature: string;
  pdftrusted: string;
  competitor: string;
};

export type CompareCompetitor = {
  slug: string;
  name: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  intro: string[];
  rows: CompareFeatureRow[];
  advantages: Array<{ title: string; body: string }>;
  faqs: ToolFaq[];
  recommendedTools: Array<{ slug: string; label: string }>;
};

const SAFE =
  "PDFTrusted runs largely in your browser. Privacy-First mode keeps files in RAM without cloud uploads. Optional staging auto-expires within 24 hours.";

export const COMPARE_HUB = {
  slug: "compare",
  metaTitle: "PDFTrusted vs Other PDF Tools — Honest Comparisons",
  metaDescription:
    "Compare PDFTrusted with iLovePDF, Smallpdf, Sejda, PDF24, and Adobe Acrobat. Hybrid AI PDF platform — Private Local privacy plus Turbo Cloud power.",
  keywords:
    "pdftrusted vs ilovepdf, smallpdf alternative, sejda alternative, pdf24 alternative, adobe acrobat alternative, hybrid pdf platform",
  intro: [
    "PDFTrusted is a hybrid AI PDF platform: Private Local when you want zero upload, Turbo Cloud when you need heavy compression, OCR, or AI on large files.",
    "Use these honest guides to compare merge, compress, sign, edit, and security — then try tools free in your browser or with 10 monthly cloud credits when signed in.",
  ],
  faqs: [
    {
      question: "Is PDFTrusted really free?",
      answer: "Core tools are free with generous limits. Privacy-First mode supports large in-browser batches (e.g. 50-file merge) without cloud staging.",
    },
    {
      question: "Do I need to sign up?",
      answer: "No account is required for standard merge, compress, split, sign, and edit workflows.",
    },
    {
      question: "How is PDFTrusted different from iLovePDF or Smallpdf?",
      answer:
        "PDFTrusted emphasizes browser-first processing, TrustShield RAM-only privacy, Hard Lock immutable exports, and a growing Acrobat-class editor — without pushing you into a paid desktop suite for basic tasks.",
    },
  ] as ToolFaq[],
};

export const COMPARE_COMPETITORS: Record<string, CompareCompetitor> = {
  ilovepdf: {
    slug: "ilovepdf",
    name: "iLovePDF",
    tagline: "Free browser PDF tools with a familiar workflow — compared side by side with PDFTrusted.",
    metaTitle: "PDFTrusted vs iLovePDF — Free, No Sign-up | Secure Alternative",
    metaDescription:
      "Compare PDFTrusted and iLovePDF for merge, compress, sign, and privacy. See why teams switch to TrustShield RAM-only processing and Hard Lock security.",
    keywords:
      "pdftrusted vs ilovepdf, ilovepdf alternative, secure ilovepdf alternative, free pdf tools no signup",
    intro: [
      "iLovePDF popularized quick online PDF tasks. PDFTrusted targets the same jobs — merge, compress, split, convert, sign — with a stronger privacy story and editor features aimed at power users.",
      "If you need batch merge without uploading sensitive contracts to a third-party queue, PDFTrusted Privacy-First mode keeps files in browser memory. Hard Lock flattening adds non-editable exports iLovePDF does not emphasize.",
      SAFE,
    ],
    rows: [
      { feature: "Account for basic tools", pdftrusted: "Not required", competitor: "Often optional; premium pushes sign-in" },
      { feature: "Privacy-First (RAM-only)", pdftrusted: "Built-in default toggle", competitor: "Upload-centric model" },
      { feature: "PDF Editor + signatures", pdftrusted: "Fabric editor + Sign PDF + validation", competitor: "Limited edit; separate products" },
      { feature: "Immutable Hard Lock export", pdftrusted: "Yes — image-layer flatten", competitor: "Not a core feature" },
      { feature: "Document health pre-scan", pdftrusted: "TrustShield auditor on major tools", competitor: "Varies by tool" },
      { feature: "OCR / redact / repair", pdftrusted: "In-browser ultra-tools", competitor: "Available; often server-side" },
    ],
    advantages: [
      {
        title: "TrustShield privacy by default",
        body: "Turn on Privacy-First to skip cloud staging. Merge up to 50 PDFs locally when your device has RAM headroom.",
      },
      {
        title: "Editor + sign in one brand",
        body: "Annotate, whiteout, edit text runs, and place hi-res signatures — then optionally Hard Lock before download.",
      },
      {
        title: "Transparent limits",
        body: "Clear file-size gates and honest coming-soon labels — no silent passthrough downloads.",
      },
    ],
    faqs: [
      {
        question: "Can PDFTrusted replace iLovePDF for daily office work?",
        answer:
          "For merge, compress, split, watermark, unlock, sign, and edit, yes. Enterprise prepress, DRM, and advanced Acrobat plug-ins still belong in dedicated suites.",
      },
      {
        question: "Which tool should I try first?",
        answer: "Start with Merge PDF or PDF Editor — they showcase speed and TrustShield privacy in one session.",
      },
      {
        question: "Are files uploaded to PDFTrusted servers?",
        answer:
          "In Privacy-First mode, processing stays in your browser. Larger files may use short-lived staging only when you disable privacy mode and size requires it.",
      },
    ],
    recommendedTools: [
      { slug: "merge-pdf", label: "Merge PDF" },
      { slug: "compress-pdf", label: "Compress PDF" },
      { slug: "pdf-editor", label: "PDF Editor" },
      { slug: "sign-pdf", label: "Sign PDF" },
    ],
  },
  smallpdf: {
    slug: "smallpdf",
    name: "Smallpdf",
    tagline: "Lightweight online PDF suite vs PDFTrusted — privacy, editor depth, and pricing philosophy.",
    metaTitle: "PDFTrusted vs Smallpdf — Free, No Sign-up | Secure Alternative",
    metaDescription:
      "PDFTrusted vs Smallpdf: compare browser PDF merge, compress, e-sign, and privacy. Free core tools with TrustShield and Hard Lock.",
    keywords: "pdftrusted vs smallpdf, smallpdf alternative, free pdf editor online, secure pdf compressor",
    intro: [
      "Smallpdf built a polished brand around simple PDF utilities. PDFTrusted competes on the same surface area while investing in editor-grade features and explicit privacy controls.",
      "Teams handling NDAs, medical forms, or financial PDFs often want a RAM-only path — PDFTrusted documents that path instead of treating every file as an upload job.",
      SAFE,
    ],
    rows: [
      { feature: "Free tier breadth", pdftrusted: "Core tools without paywall tricks", competitor: "Free trials; Pro for heavy use" },
      { feature: "Client-side merge/compress", pdftrusted: "PDFTrusted Private Engine in browser", competitor: "Hybrid cloud processing" },
      { feature: "Text edit in PDF", pdftrusted: "PDFTrusted Core text edit + export", competitor: "Limited; often convert-out" },
      { feature: "Document Q&A", pdftrusted: "Planned — browser-first, no server storage", competitor: "Pro AI add-ons" },
      { feature: "AES Protect PDF", pdftrusted: "Client-side .pdftrusted package", competitor: "Password tools vary" },
      { feature: "Comparison transparency", pdftrusted: "Public compare pages (this hub)", competitor: "Marketing-focused" },
    ],
    advantages: [
      {
        title: "No surprise file returns",
        body: "Registry-backed tools return real outputs or clear errors — not unchanged passthrough files.",
      },
      {
        title: "Acrobat-killer editor trajectory",
        body: "Pen, whiteout, signatures, page ops, and text-run edits in one workspace.",
      },
      {
        title: "SEO-friendly knowledge hubs",
        body: "Every major tool includes long-form guides and FAQ schema for informed users.",
      },
    ],
    faqs: [
      {
        question: "Is PDFTrusted faster than Smallpdf?",
        answer:
          "For small and medium PDFs processed locally, yes — no round trip to a queue. Very large files may use staging similar to other cloud hybrids.",
      },
      {
        question: "Does PDFTrusted work on mobile?",
        answer: "Modern mobile browsers run merge, compress, and view workflows; heavy edit sessions are best on tablet or desktop RAM.",
      },
    ],
    recommendedTools: [
      { slug: "compress-pdf", label: "Compress PDF" },
      { slug: "pdf-to-word", label: "PDF to Word" },
      { slug: "hard-lock-pdf", label: "Hard Lock PDF" },
      { slug: "protect-pdf", label: "Protect PDF" },
    ],
  },
  "adobe-acrobat": {
    slug: "adobe-acrobat",
    name: "Adobe Acrobat",
    tagline: "Desktop PDF standard vs PDFTrusted — when to use each for speed, cost, and security.",
    metaTitle: "PDFTrusted vs Adobe Acrobat — Free Browser Alternative",
    metaDescription:
      "Compare PDFTrusted with Adobe Acrobat for merge, sign, edit, and security. Free in-browser tools vs desktop subscription — honest feature matrix.",
    keywords:
      "adobe acrobat alternative free, pdftrusted vs acrobat, online pdf editor vs acrobat, sign pdf without acrobat",
    intro: [
      "Adobe Acrobat remains the enterprise reference for prepress, accessibility audits, and complex forms. PDFTrusted is not trying to clone every Acrobat panel — it delivers fast, free browser workflows for the 90% of office tasks.",
      "Use PDFTrusted when you need merge/compress/sign/edit in minutes without installing Creative Cloud. Keep Acrobat for regulated print pipelines and legacy plug-ins.",
      SAFE,
    ],
    rows: [
      { feature: "Install required", pdftrusted: "No — web app + PWA", competitor: "Desktop / mobile apps" },
      { feature: "Subscription", pdftrusted: "Free core; optional premium", competitor: "Acrobat Pro subscription" },
      { feature: "Sign + flatten", pdftrusted: "Sign PDF + Hard Lock", competitor: "Acrobat Sign ecosystem" },
      { feature: "Preflight / print", pdftrusted: "TrustShield health scan", competitor: "Industry-leading preflight" },
      { feature: "Form authoring", pdftrusted: "Coming / basic", competitor: "Advanced AcroForm designer" },
      { feature: "Batch OCR", pdftrusted: "Browser OCR (Tesseract)", competitor: "Robust OCR + language packs" },
    ],
    advantages: [
      {
        title: "Instant access for guests",
        body: "Share a link — collaborators merge or sign without Acrobat licenses.",
      },
      {
        title: "Hard Lock immutability",
        body: "Rasterize final PDFs so text and signatures cannot be altered in any reader.",
      },
      {
        title: "Lower TCO for teams",
        body: "Reduce per-seat Acrobat costs for staff who only combine or compress PDFs occasionally.",
      },
    ],
    faqs: [
      {
        question: "Can PDFTrusted open all Acrobat files?",
        answer: "Standard PDFs yes. Exotic plug-in portfolios or XFA-heavy forms may still need Acrobat.",
      },
      {
        question: "Is PDFTrusted legally binding for e-sign?",
        answer: "You control the exported PDF; consult your jurisdiction's e-signature rules for compliance workflows.",
      },
    ],
    recommendedTools: [
      { slug: "sign-pdf", label: "Sign PDF" },
      { slug: "pdf-editor", label: "PDF Editor" },
      { slug: "ocr-pdf", label: "OCR PDF" },
      { slug: "unlock-pdf", label: "Unlock PDF" },
    ],
  },
  sejda: {
    slug: "sejda",
    name: "Sejda",
    tagline: "Popular online PDF editor vs PDFTrusted — privacy, editor depth, and free limits.",
    metaTitle: "PDFTrusted vs Sejda — Free Browser PDF Tools | Privacy Alternative",
    metaDescription:
      "Compare PDFTrusted and Sejda for merge, compress, edit, and sign. Browser-first TrustShield privacy vs upload queues — honest feature matrix.",
    keywords:
      "pdftrusted vs sejda, sejda alternative, sejda alternative free, online pdf editor no upload",
    intro: [
      "Sejda offers a polished web editor and task-based PDF utilities. PDFTrusted covers the same daily workflows with stronger in-browser processing and explicit Privacy-First controls.",
      "If you process contracts or HR packets, PDFTrusted lets you merge and compress without sending every file through a third-party queue when Privacy-First is enabled.",
      SAFE,
    ],
    rows: [
      { feature: "Daily task limits", pdftrusted: "Generous free core tools", competitor: "Hourly/daily caps on free tier" },
      { feature: "Privacy-First (RAM-only)", pdftrusted: "Default toggle on major tools", competitor: "Upload-centric processing" },
      { feature: "PDF Editor", pdftrusted: "Fabric workspace + text runs", competitor: "Strong editor; server-assisted" },
      { feature: "Hard Lock flatten", pdftrusted: "Immutable image-layer export", competitor: "Not emphasized" },
      { feature: "Sign PDF", pdftrusted: "Hi-res signatures + validation", competitor: "Available; workflow varies" },
      { feature: "Knowledge hub + FAQ schema", pdftrusted: "Per-tool long-form SEO hubs", competitor: "Help center focused" },
    ],
    advantages: [
      {
        title: "Fewer upload surprises",
        body: "Privacy-First keeps merge/compress local when RAM allows — ideal for NDAs and medical forms.",
      },
      {
        title: "One brand for edit + sign + lock",
        body: "Annotate, sign, then Hard Lock in one session without switching products.",
      },
      {
        title: "Transparent compare pages",
        body: "Public side-by-side guides (this hub) help buyers make informed switches.",
      },
    ],
    faqs: [
      {
        question: "When is Sejda still the better pick?",
        answer:
          "Heavy form filling, niche Sejda Pro features, or workflows you already automated in Sejda may justify staying — PDFTrusted targets speed, privacy, and free core tools.",
      },
      {
        question: "Can I try PDFTrusted without an account?",
        answer: "Yes — merge, compress, split, sign, and edit work without sign-up on the free tier.",
      },
    ],
    recommendedTools: [
      { slug: "merge-pdf", label: "Merge PDF" },
      { slug: "pdf-editor", label: "PDF Editor" },
      { slug: "compress-pdf", label: "Compress PDF" },
      { slug: "hard-lock-pdf", label: "Hard Lock PDF" },
    ],
  },
  pdf24: {
    slug: "pdf24",
    name: "PDF24",
    tagline: "Free PDF toolbox vs PDFTrusted — web tools, desktop app, and privacy philosophy.",
    metaTitle: "PDFTrusted vs PDF24 — Free Online PDF Alternative",
    metaDescription:
      "PDFTrusted vs PDF24: compare merge, compress, convert, and edit. Browser-first TrustShield vs desktop installer — feature and privacy comparison.",
    keywords:
      "pdftrusted vs pdf24, pdf24 alternative, pdf24 online alternative, free pdf tools browser",
    intro: [
      "PDF24 built trust with a broad free toolbox and optional desktop installer. PDFTrusted competes on the same free positioning while prioritizing modern browser engines and TrustShield privacy.",
      "Choose PDFTrusted when collaborators only need a link — no installer, no account, and optional RAM-only processing for sensitive PDFs.",
      SAFE,
    ],
    rows: [
      { feature: "Install required", pdftrusted: "No — PWA-ready web app", competitor: "Optional PDF24 Creator desktop" },
      { feature: "Account for basics", pdftrusted: "Not required", competitor: "Often optional" },
      { feature: "Client-side merge/compress", pdftrusted: "Private Engine in browser", competitor: "Mix of local app + online" },
      { feature: "TrustShield health scan", pdftrusted: "On major tools", competitor: "Varies" },
      { feature: "Editor + redact + repair", pdftrusted: "Unified ultra-tool set", competitor: "Wide catalog" },
      { feature: "International SEO URLs", pdftrusted: "Native slugs per locale", competitor: "Primarily English paths" },
    ],
    advantages: [
      {
        title: "Link-first collaboration",
        body: "Send `/es/comprimir-pdf` or `/de/pdf-komprimieren` — localized URLs for global teams.",
      },
      {
        title: "No desktop dependency",
        body: "Full merge/compress/sign/edit in the browser on managed Chromebooks and locked-down PCs.",
      },
      {
        title: "Hard Lock + Protect",
        body: "Client-side immutability and encryption packages beyond basic password tools.",
      },
    ],
    faqs: [
      {
        question: "Does PDF24's desktop app beat PDFTrusted?",
        answer:
          "For offline bulk on air-gapped machines, a desktop suite can win. For quick browser tasks and shared links, PDFTrusted is faster to deploy.",
      },
      {
        question: "Are PDF24 and PDFTrusted both free?",
        answer: "Both offer free tiers; PDFTrusted documents limits clearly and avoids fake review stars in schema.",
      },
    ],
    recommendedTools: [
      { slug: "compress-pdf", label: "Compress PDF" },
      { slug: "merge-pdf", label: "Merge PDF" },
      { slug: "repair-pdf", label: "Repair PDF" },
      { slug: "redact-pdf", label: "Redact PDF" },
    ],
  },
};

export const COMPARE_SLUGS = Object.keys(COMPARE_COMPETITORS);

export function getCompareCompetitor(slug: string): CompareCompetitor | undefined {
  return COMPARE_COMPETITORS[slug];
}
