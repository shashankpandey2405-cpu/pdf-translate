/**
 * Extra FAQs + meta for top-5 traffic keywords (all 7 locales).
 * Merged in localeToolSeo/index.ts — strengthens hubs without thin duplicate pages.
 */
import type { LocaleCode } from "@/lib/seo/site";
import type { ToolFaq } from "@/data/seo/toolSeoBundles";

type HeroSlug = "merge-pdf" | "compress-pdf" | "pdf-to-word" | "pdf-to-image" | "word-to-pdf";

type HeroSeoExtra = {
  metaDescription?: string;
  extraFaqs: ToolFaq[];
};

const EN: Record<HeroSlug, HeroSeoExtra> = {
  "merge-pdf": {
    metaDescription:
      "Merge PDF online free — combine PDFs and images in your browser. Privacy-first, up to 100 files on desktop. No signup for browser merge.",
    extraFaqs: [
      {
        question: "Does merge upload my files to a server?",
        answer:
          "In browser mode, PDFs and images are merged locally in your tab. Trusted Cloud is only suggested when a batch is too heavy for your device.",
      },
      {
        question: "Can I merge JPG and PNG with PDF?",
        answer: "Yes — PNG, JPG, WebP, HEIC, and PDF pages merge in the order you set.",
      },
    ],
  },
  "compress-pdf": {
    metaDescription:
      "Compress PDF free: light optimize in browser or Ghostscript-class compression via Trusted Cloud. Honest tiers — no fake shrink in browser.",
    extraFaqs: [
      {
        question: "Why is browser compression smaller than iLovePDF?",
        answer:
          "Browser mode safely removes metadata and light-optimizes structure. For large image-heavy PDFs, use Trusted Cloud (Ghostscript) for real file-size reduction.",
      },
      {
        question: "Which compression should I pick?",
        answer:
          "Use Browser for quick, private tweaks. Use Trusted Cloud when email still rejects the file size.",
      },
    ],
  },
  "pdf-to-word": {
    metaDescription:
      "PDF to Word online: browser exports RTF text fast and private; Trusted Cloud gives layout-aware DOCX for scans and complex PDFs.",
    extraFaqs: [
      {
        question: "Is the browser download DOCX or RTF?",
        answer:
          "Browser mode produces RTF (opens in Word). Trusted Cloud produces DOCX with better layout and OCR for scanned pages.",
      },
      {
        question: "Will tables and columns copy perfectly?",
        answer:
          "Digital PDFs work well in browser. Complex layouts and scans need Trusted Cloud conversion.",
      },
    ],
  },
  "pdf-to-image": {
    metaDescription:
      "PDF to JPG or PNG free — export every page as images in your browser with scroll preview. ZIP download, privacy-first.",
    extraFaqs: [
      {
        question: "One page or all pages?",
        answer: "You get a ZIP with every page as JPG or PNG. Preview scrolls through all pages before download.",
      },
      {
        question: "Is this better than screenshotting?",
        answer: "Yes — native render keeps sharper text than screen captures.",
      },
    ],
  },
  "word-to-pdf": {
    metaDescription:
      "Word to PDF online — DOCX and DOC converted on Trusted Cloud (LibreOffice) for print-ready PDF. Sign in free, 10 jobs/day.",
    extraFaqs: [
      {
        question: "Why is Word to PDF cloud-only?",
        answer:
          "Accurate fonts and layouts need LibreOffice on our workers. Browser cannot match desktop Word fidelity.",
      },
      {
        question: "Is sign-in required?",
        answer: "Free Trusted Cloud account — not a paid subscription. 10 conversions per day, up to 60MB.",
      },
    ],
  },
};

function translateBlock(
  locale: LocaleCode,
  map: Record<HeroSlug, HeroSeoExtra>,
): Record<string, HeroSeoExtra> {
  return map;
}

const HI: Record<HeroSlug, HeroSeoExtra> = {
  "merge-pdf": {
    extraFaqs: [
      {
        question: "क्या मर्ज पर फाइल सर्वर पर जाती है?",
        answer: "ब्राउज़र मोड में फाइलें आपके डिवाइस पर मर्ज होती हैं। बड़े बैच के लिए Trusted Cloud सुझाया जाता है।",
      },
      {
        question: "JPG और PDF एक साथ?",
        answer: "हाँ — PNG, JPG, WebP, HEIC और PDF क्रम से मर्ज होते हैं।",
      },
    ],
  },
  "compress-pdf": {
    extraFaqs: [
      {
        question: "ब्राउज़र में कंप्रेस कम क्यों दिखता है?",
        answer: "ब्राउज़र सुरक्षित हल्का ऑप्टिमाइज़ करता है। असली छोटा साइज़ Trusted Cloud (Ghostscript) से मिलता है।",
      },
    ],
  },
  "pdf-to-word": {
    extraFaqs: [
      {
        question: "ब्राउज़र RTF देता है या DOCX?",
        answer: "ब्राउज़र RTF; Trusted Cloud बेहतर DOCX और OCR देता है।",
      },
    ],
  },
  "pdf-to-image": {
    extraFaqs: [
      {
        question: "सभी पेज इमेज में?",
        answer: "हाँ — हर पेज JPG/PNG ZIP में; प्रीव्यू में स्क्रॉल करें।",
      },
    ],
  },
  "word-to-pdf": {
    extraFaqs: [
      {
        question: "Word to PDF क्लाउड पर ही क्यों?",
        answer: "सही फॉन्ट और लेआउट के लिए LibreOffice वर्कर ज़रूरी है।",
      },
    ],
  },
};

const ES: Record<HeroSlug, HeroSeoExtra> = {
  "merge-pdf": {
    extraFaqs: [
      {
        question: "¿Sube mis archivos a un servidor?",
        answer: "En el navegador, la fusión es local. La nube solo se sugiere si el lote es muy pesado.",
      },
    ],
  },
  "compress-pdf": {
    extraFaqs: [
      {
        question: "¿Por qué comprimir en navegador reduce menos?",
        answer: "El navegador optimiza de forma segura y ligera. Use Trusted Cloud (Ghostscript) para reducción real.",
      },
    ],
  },
  "pdf-to-word": {
    extraFaqs: [
      {
        question: "¿RTF o DOCX en el navegador?",
        answer: "Navegador: RTF. Trusted Cloud: DOCX con mejor diseño y OCR.",
      },
    ],
  },
  "pdf-to-image": { extraFaqs: [] },
  "word-to-pdf": {
    extraFaqs: [
      {
        question: "¿Por qué Word a PDF solo en la nube?",
        answer: "LibreOffice en servidores seguros conserva fuentes y diseño.",
      },
    ],
  },
};

const DE: Record<HeroSlug, HeroSeoExtra> = {
  "compress-pdf": {
    extraFaqs: [
      {
        question: "Warum ist Browser-Komprimierung kleiner?",
        answer: "Im Browser nur sichere leichte Optimierung. Echte Verkleinerung mit Trusted Cloud (Ghostscript).",
      },
    ],
  },
  "pdf-to-word": {
    extraFaqs: [
      {
        question: "RTF oder DOCX?",
        answer: "Browser: RTF. Trusted Cloud: DOCX mit Layout und OCR.",
      },
    ],
  },
  "merge-pdf": { extraFaqs: [] },
  "pdf-to-image": { extraFaqs: [] },
  "word-to-pdf": { extraFaqs: [] },
};

const FR: Record<HeroSlug, HeroSeoExtra> = {
  "compress-pdf": {
    extraFaqs: [
      {
        question: "Pourquoi moins de réduction dans le navigateur ?",
        answer:
          "Le navigateur optimise légèrement. Pour une vraie réduction, utilisez Trusted Cloud (Ghostscript).",
      },
    ],
  },
  "pdf-to-word": {
    extraFaqs: [
      {
        question: "RTF ou DOCX ?",
        answer: "Navigateur : RTF. Trusted Cloud : DOCX avec mise en page et OCR.",
      },
    ],
  },
  "merge-pdf": { extraFaqs: [] },
  "pdf-to-image": { extraFaqs: [] },
  "word-to-pdf": { extraFaqs: [] },
};

const ZH: Record<HeroSlug, HeroSeoExtra> = {
  "compress-pdf": {
    extraFaqs: [
      {
        question: "为什么浏览器压缩效果较小？",
        answer: "浏览器模式安全轻量优化。真正缩小文件请用 Trusted Cloud（Ghostscript）。",
      },
    ],
  },
  "pdf-to-word": {
    extraFaqs: [
      { question: "浏览器导出 RTF 还是 DOCX？", answer: "浏览器：RTF。Trusted Cloud：版式更好的 DOCX 与 OCR。" },
    ],
  },
  "merge-pdf": { extraFaqs: [] },
  "pdf-to-image": { extraFaqs: [] },
  "word-to-pdf": { extraFaqs: [] },
};

const AR: Record<HeroSlug, HeroSeoExtra> = {
  "compress-pdf": {
    extraFaqs: [
      {
        question: "لماذا الضغط في المتصفح أقل؟",
        answer: "المتصفح يُحسّن بشكل خفيف وآمن. للتقليل الحقيقي استخدم Trusted Cloud.",
      },
    ],
  },
  "pdf-to-word": {
    extraFaqs: [
      { question: "RTF أم DOCX؟", answer: "المتصفح: RTF. Trusted Cloud: DOCX مع تخطيط أفضل و OCR." },
    ],
  },
  "merge-pdf": { extraFaqs: [] },
  "pdf-to-image": { extraFaqs: [] },
  "word-to-pdf": { extraFaqs: [] },
};

export const HERO_KEYWORD_SEO: Partial<Record<LocaleCode, Record<string, HeroSeoExtra>>> = {
  en: EN,
  hi: HI,
  es: ES,
  de: DE,
  fr: FR,
  zh: ZH,
  ar: AR,
};

export function mergeHeroKeywordSeo(
  locale: LocaleCode,
  slug: string,
  baseFaqs: ToolFaq[] | undefined,
  baseMeta?: string,
): { faqs: ToolFaq[]; metaDescription?: string } {
  const extra = HERO_KEYWORD_SEO[locale]?.[slug as HeroSlug];
  if (!extra) return { faqs: baseFaqs ?? [], metaDescription: baseMeta };
  return {
    faqs: [...(baseFaqs ?? []), ...extra.extraFaqs],
    metaDescription: extra.metaDescription ?? baseMeta,
  };
}
