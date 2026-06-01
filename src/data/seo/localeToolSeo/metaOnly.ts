import type { LocaleCode } from "@/lib/seo/site";
import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

/** Meta title/description/keywords only — body/FAQs stay English until translated. */
const TOP_SLUGS = [
  "merge-pdf",
  "compress-pdf",
  "pdf-to-word",
  "word-to-pdf",
  "pdf-editor",
  "sign-pdf",
  "ocr-pdf",
  "split-pdf",
  "protect-pdf",
  "unlock-pdf",
] as const;

type Meta = Pick<ToolRichSeo, "title" | "description" | "keywords">;

const ZH: Record<(typeof TOP_SLUGS)[number], Meta> = {
  "merge-pdf": {
    title: "在线合并 PDF — 合并文件 | PDFTrusted",
    description: "将多个 PDF 和图片合并为一个文件。浏览器内安全处理，缩略图排序，即时下载。",
    keywords: "合并pdf, pdf合并, 在线合并pdf, 免费pdf合并",
  },
  "compress-pdf": {
    title: "在线压缩 PDF — 减小文件 | PDFTrusted",
    description: "为邮件和分享减小 PDF 体积。智能预设，浏览器快速处理。",
    keywords: "压缩pdf, pdf压缩, 减小pdf大小, 在线压缩",
  },
  "pdf-to-word": {
    title: "PDF 转 Word — DOCX 转换 | PDFTrusted",
    description: "将 PDF 转为可编辑 Word。扫描件可用 Trusted Pro OCR。",
    keywords: "pdf转word, pdf转docx, ocr pdf",
  },
  "word-to-pdf": {
    title: "Word 转 PDF — DOCX 转换 | PDFTrusted",
    description: "高质量 Word 转 PDF，保留版式。",
    keywords: "word转pdf, docx转pdf",
  },
  "pdf-editor": {
    title: "在线 PDF 编辑器 — 注释与编辑 | PDFTrusted",
    description: "在浏览器中注释、签名、重排页面并导出 PDF。",
    keywords: "pdf编辑器, 在线编辑pdf, 注释pdf",
  },
  "sign-pdf": {
    title: "在线签署 PDF — 电子签名 | PDFTrusted",
    description: "绘制或输入签名添加到 PDF，浏览器私密处理。",
    keywords: "pdf签名, 电子签名pdf, 在线签字",
  },
  "ocr-pdf": {
    title: "PDF OCR — 扫描件识别 | PDFTrusted",
    description: "让扫描 PDF 可搜索。安全云端 OCR。",
    keywords: "pdf ocr, 扫描pdf文字识别",
  },
  "split-pdf": {
    title: "拆分 PDF — 提取页面 | PDFTrusted",
    description: "将选定页面导出为新 PDF，缩略图选择。",
    keywords: "拆分pdf, 提取pdf页面",
  },
  "protect-pdf": {
    title: "保护 PDF — 添加密码 | PDFTrusted",
    description: "为 PDF 设置密码保护，浏览器加密。",
    keywords: "pdf加密, pdf密码保护",
  },
  "unlock-pdf": {
    title: "解锁 PDF — 移除密码 | PDFTrusted",
    description: "在合法前提下移除 PDF 限制。",
    keywords: "pdf解密, 移除pdf密码",
  },
};

const AR: Record<(typeof TOP_SLUGS)[number], Meta> = {
  "merge-pdf": {
    title: "دمج PDF عبر الإنترنت — دمج الملفات | PDFTrusted",
    description: "دمج عدة ملفات PDF وصور في ملف واحد. معالجة آمنة في المتصفح مع ترتيب بالصور المصغرة.",
    keywords: "دمج pdf, دمج ملفات pdf, merge pdf arabic",
  },
  "compress-pdf": {
    title: "ضغط PDF عبر الإنترنت | PDFTrusted",
    description: "تقليل حجم PDF للبريد والمشاركة. معالجة سريعة في المتصفح.",
    keywords: "ضغط pdf, تقليل حجم pdf",
  },
  "pdf-to-word": {
    title: "PDF إلى Word — تحويل DOCX | PDFTrusted",
    description: "تحويل PDF إلى Word قابل للتحرير. OCR للمسح الضوئي.",
    keywords: "pdf الى word, تحويل pdf",
  },
  "word-to-pdf": {
    title: "Word إلى PDF | PDFTrusted",
    description: "تحويل Word إلى PDF بجودة عالية.",
    keywords: "word الى pdf, docx pdf",
  },
  "pdf-editor": {
    title: "محرر PDF عبر الإنترنت | PDFTrusted",
    description: "تعليق وتوقيع وإعادة ترتيب الصفحات في المتصفح.",
    keywords: "محرر pdf, تحرير pdf",
  },
  "sign-pdf": {
    title: "توقيع PDF عبر الإنترنت | PDFTrusted",
    description: "أضف توقيعاً بالرسم أو الكتابة على PDF.",
    keywords: "توقيع pdf, توقيع إلكتروني",
  },
  "ocr-pdf": {
    title: "OCR PDF — نص قابل للبحث | PDFTrusted",
    description: "جعل ملفات PDF الممسوحة قابلة للبحث عبر OCR سحابي.",
    keywords: "ocr pdf, مسح pdf",
  },
  "split-pdf": {
    title: "تقسيم PDF — استخراج الصفحات | PDFTrusted",
    description: "استخراج صفحات محددة إلى ملف PDF جديد.",
    keywords: "تقسيم pdf, استخراج صفحات",
  },
  "protect-pdf": {
    title: "حماية PDF — كلمة مرور | PDFTrusted",
    description: "إضافة كلمة مرور لحماية PDF.",
    keywords: "حماية pdf, تشفير pdf",
  },
  "unlock-pdf": {
    title: "فتح PDF — إزالة كلمة المرور | PDFTrusted",
    description: "إزالة القيود عندما يكون ذلك مسموحاً قانونياً.",
    keywords: "فتح pdf, ازالة كلمة مرور pdf",
  },
};

const FR: Record<(typeof TOP_SLUGS)[number], Meta> = {
  "merge-pdf": {
    title: "Fusionner PDF en ligne | PDFTrusted",
    description: "Combinez plusieurs PDF et photos en un fichier. Tri par vignettes, téléchargement instantané.",
    keywords: "fusionner pdf, combiner pdf, merge pdf gratuit",
  },
  "compress-pdf": {
    title: "Compresser PDF en ligne | PDFTrusted",
    description: "Réduisez la taille du PDF pour e-mail et partage.",
    keywords: "compresser pdf, reduire taille pdf",
  },
  "pdf-to-word": {
    title: "PDF vers Word — DOCX | PDFTrusted",
    description: "Convertissez PDF en Word modifiable. OCR pour scans.",
    keywords: "pdf vers word, convertir pdf docx",
  },
  "word-to-pdf": {
    title: "Word vers PDF | PDFTrusted",
    description: "Conversion Word en PDF haute fidélité.",
    keywords: "word vers pdf, docx pdf",
  },
  "pdf-editor": {
    title: "Éditeur PDF en ligne | PDFTrusted",
    description: "Annoter, signer, réorganiser et exporter en navigateur.",
    keywords: "editeur pdf, modifier pdf en ligne",
  },
  "sign-pdf": {
    title: "Signer PDF en ligne | PDFTrusted",
    description: "Signature manuscrite ou tapée sur PDF.",
    keywords: "signer pdf, signature electronique pdf",
  },
  "ocr-pdf": {
    title: "OCR PDF — Texte recherchable | PDFTrusted",
    description: "Rendez les scans PDF recherchables via OCR cloud.",
    keywords: "ocr pdf, pdf scan texte",
  },
  "split-pdf": {
    title: "Diviser PDF — Extraire pages | PDFTrusted",
    description: "Extrayez des pages sélectionnées vers un nouveau PDF.",
    keywords: "diviser pdf, extraire pages pdf",
  },
  "protect-pdf": {
    title: "Protéger PDF — Mot de passe | PDFTrusted",
    description: "Ajoutez un mot de passe à votre PDF.",
    keywords: "proteger pdf, mot de passe pdf",
  },
  "unlock-pdf": {
    title: "Déverrouiller PDF | PDFTrusted",
    description: "Supprimez les restrictions lorsque c'est autorisé.",
    keywords: "deverrouiller pdf, enlever mot de passe pdf",
  },
};

const DE: Record<(typeof TOP_SLUGS)[number], Meta> = {
  "merge-pdf": {
    title: "PDF zusammenführen online | PDFTrusted",
    description: "Mehrere PDFs und Fotos zu einer Datei verbinden. Sichere Browser-Verarbeitung.",
    keywords: "pdf zusammenfuegen, pdf merge, pdf verbinden",
  },
  "compress-pdf": {
    title: "PDF komprimieren online | PDFTrusted",
    description: "PDF-Größe für E-Mail und Teilen reduzieren.",
    keywords: "pdf komprimieren, pdf verkleinern",
  },
  "pdf-to-word": {
    title: "PDF zu Word — DOCX | PDFTrusted",
    description: "PDF in bearbeitbares Word umwandeln. OCR für Scans.",
    keywords: "pdf zu word, pdf in docx",
  },
  "word-to-pdf": {
    title: "Word zu PDF | PDFTrusted",
    description: "Word-Dateien in hochwertiges PDF konvertieren.",
    keywords: "word zu pdf, docx zu pdf",
  },
  "pdf-editor": {
    title: "PDF-Editor online | PDFTrusted",
    description: "Annotieren, signieren, Seiten sortieren im Browser.",
    keywords: "pdf editor, pdf bearbeiten online",
  },
  "sign-pdf": {
    title: "PDF signieren online | PDFTrusted",
    description: "Unterschrift zeichnen oder tippen und auf PDF platzieren.",
    keywords: "pdf signieren, elektronische signatur pdf",
  },
  "ocr-pdf": {
    title: "PDF OCR — Durchsuchbar | PDFTrusted",
    description: "Gescannte PDFs per Cloud-OCR durchsuchbar machen.",
    keywords: "pdf ocr, scan text erkennen",
  },
  "split-pdf": {
    title: "PDF teilen — Seiten extrahieren | PDFTrusted",
    description: "Ausgewählte Seiten in neues PDF exportieren.",
    keywords: "pdf teilen, seiten extrahieren",
  },
  "protect-pdf": {
    title: "PDF schützen — Passwort | PDFTrusted",
    description: "Passwortschutz für PDF-Dateien.",
    keywords: "pdf schuetzen, pdf passwort",
  },
  "unlock-pdf": {
    title: "PDF entsperren | PDFTrusted",
    description: "Beschränkungen entfernen wenn rechtlich zulässig.",
    keywords: "pdf entsperren, passwort entfernen",
  },
};

export const META_ONLY_LOCALES: Partial<Record<LocaleCode, Record<string, Partial<ToolRichSeo>>>> = {
  zh: ZH,
  ar: AR,
  fr: FR,
  de: DE,
};
