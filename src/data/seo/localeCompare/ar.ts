import type { CompareCompetitor } from "@/data/seo/comparePages";
import type { CompareHubCopy } from "@/lib/seo/localizedCompareSeo";

const SAFE =
  "يعمل PDFTrusted في المتصفح. وضع الخصوصية يبقي الملفات في الذاكرة؛ التخزين المؤقت يُحذف خلال 24 ساعة.";

export const AR_COMPARE: {
  hub: Partial<CompareHubCopy>;
  competitors: Record<string, Partial<CompareCompetitor>>;
} = {
  hub: {
    metaTitle: "PDFTrusted مقابل أدوات PDF الأخرى — مقارنات صادقة",
    metaDescription:
      "قارن PDFTrusted مع iLovePDF وSmallpdf وAdobe Acrobat. مجاني، بلا تسجيل، المتصفح أولاً وخصوصية TrustShield.",
    keywords: "pdftrusted مقابل ilovepdf, بديل smallpdf, بديل adobe acrobat",
    intro: [
      "اختيار منصة PDF يعني موازنة السرعة والخصوصية والتكلفة. PDFTrusted للمستخدمين الذين يريدون نتائج احترافية دون تثبيت برامج أو حسابات متكررة.",
      "اطلع على الدمج والضغط والتوقيع والتحرير والأمان — ثم جرّب الأدوات مجاناً في المتصفح.",
    ],
    faqs: [
      { question: "هل PDFTrusted مجاني؟", answer: "الأدوات الأساسية مجانية. وضع الخصوصية يدعم دمجاً محلياً كبيراً دون سحابة." },
      { question: "هل أحتاج حساباً؟", answer: "لا للدمج والضغط والتقسيم والتوقيع والتحرير المعتاد." },
      {
        question: "كيف يختلف عن iLovePDF أو Smallpdf؟",
        answer: "PDFTrusted يؤكد المعالجة في المتصفح وTrustShield وHard Lock ومحرراً متقدماً دون اشتراك سطح مكتب.",
      },
    ],
  },
  competitors: {
    ilovepdf: {
      tagline: "أدوات PDF مألوفة — مقارنة مع PDFTrusted.",
      metaTitle: "PDFTrusted مقابل iLovePDF — مجاني بلا تسجيل",
      metaDescription: "قارن الدمج والضغط والتوقيع والخصوصية وTrustShield وHard Lock.",
      keywords: "pdftrusted vs ilovepdf arabic, بديل ilovepdf",
      intro: [
        "iLovePDF شائع للمهام السريعة. PDFTrusted يغطي نفس المهام مع خصوصية أقوى ومحرر للمستخدمين المتقدمين.",
        "للعقود الحساسة، وضع الخصوصية يبقي الملفات في ذاكرة المتصفح. Hard Lock يصدّر ملفات غير قابلة للتعديل.",
        SAFE,
      ],
      rows: [
        { feature: "حساب للأدوات الأساسية", pdftrusted: "غير مطلوب", competitor: "غالباً اختياري" },
        { feature: "خصوصية RAM فقط", pdftrusted: "مفتاح افتراضي", competitor: "نموذج رفع" },
        { feature: "محرر + توقيع", pdftrusted: "محرر Fabric + Sign PDF", competitor: "تحرير محدود" },
        { feature: "Hard Lock", pdftrusted: "نعم", competitor: "ليس أساسياً" },
        { feature: "فحص صحة المستند", pdftrusted: "TrustShield", competitor: "يختلف" },
        { feature: "OCR / تنقيح / إصلاح", pdftrusted: "في المتصفح", competitor: "غالباً سحابة" },
      ],
      advantages: [
        { title: "خصوصية TrustShield", body: "تخطّ السحابة في وضع الخصوصية وادمج حتى 50 PDF محلياً." },
        { title: "تحرير وتوقيع", body: "علّق ووقّع ثم Hard Lock قبل التحميل." },
        { title: "حدود واضحة", body: "أحجام ملفات ورسائل صادقة." },
      ],
      faqs: [
        { question: "بديل يومي لـ iLovePDF؟", answer: "نعم للدمج والضغط والتقسيم والعلامة والفتح والتوقيع والتحرير." },
        { question: "أي أداة أولاً؟", answer: "دمج PDF أو محرر PDF." },
      ],
    },
    smallpdf: {
      tagline: "مجموعة خفيفة مقابل PDFTrusted — خصوصية وعمق التحرير.",
      metaTitle: "PDFTrusted مقابل Smallpdf — مجاني وآمن",
      metaDescription: "قارن الدمج والضغط والتوقيع الإلكتروني وTrustShield.",
      keywords: "pdftrusted vs smallpdf, بديل smallpdf",
      intro: [
        "Smallpdf علامة أنيقة. PDFTrusted ينافس مع تحكم خصوصية صريح وميزات محرر.",
        "للملفات الطبية والمالية، مسار الذاكرة فقط مهم — PDFTrusted يوثّقه.",
        SAFE,
      ],
      rows: [
        { feature: "مجاني", pdftrusted: "أدوات أساسية واسعة", competitor: "تجارب وPro" },
        { feature: "دمج/ضغط محلي", pdftrusted: "محرك خاص في المتصفح", competitor: "هجين سحابي" },
        { feature: "تحرير نص", pdftrusted: "تحرير Core", competitor: "محدود" },
        { feature: "أسئلة المستند", pdftrusted: "مخطط — متصفح", competitor: "إضافات AI" },
        { feature: "حماية AES", pdftrusted: "حزمة .pdftrusted", competitor: "متنوع" },
        { feature: "شفافية", pdftrusted: "صفحات مقارنة عامة", competitor: "تسويق" },
      ],
      advantages: [
        { title: "مخرجات حقيقية", body: "لا ملفات وهمية عند الفشل." },
        { title: "محرر قوي", body: "قلم وطمس وتوقيع وصفحات." },
        { title: "مراكز معرفة SEO", body: "أدلة وFAQ لكل أداة." },
      ],
      faqs: [
        { question: "أسرع من Smallpdf؟", answer: "غالباً للملفات المتوسطة محلياً." },
        { question: "جوال؟", answer: "نعم للدمج والضغط؛ التحرير الثقيل على سطح المكتب." },
      ],
    },
    "adobe-acrobat": {
      tagline: "معيار سطح المكتب مقابل PDFTrusted.",
      metaTitle: "PDFTrusted مقابل Adobe Acrobat — بديل متصفح مجاني",
      metaDescription: "قارن الدمج والتوقيع والتحرير والأمان مقابل اشتراك Acrobat.",
      keywords: "بديل acrobat مجاني, pdftrusted vs acrobat",
      intro: [
        "Acrobat مرجع للمؤسسات والطباعة والنماذج المعقدة. PDFTrusted للمهام السريعة اليومية في المتصفح.",
        "استخدم PDFTrusted للدمج والضغط والتوقيع خلال دقائق؛ احتفظ بـ Acrobat للمسارات المنظمة.",
        SAFE,
      ],
      rows: [
        { feature: "تثبيت", pdftrusted: "لا — ويب/PWA", competitor: "تطبيقات" },
        { feature: "اشتراك", pdftrusted: "أساسي مجاني", competitor: "Acrobat Pro" },
        { feature: "توقيع + تسطيح", pdftrusted: "Sign + Hard Lock", competitor: "Acrobat Sign" },
        { feature: "طباعة/فحص", pdftrusted: "TrustShield", competitor: "preflight رائد" },
        { feature: "نماذج", pdftrusted: "أساسي/قريباً", competitor: "AcroForm متقدم" },
        { feature: "OCR جماعي", pdftrusted: "Tesseract متصفح", competitor: "OCR قوي" },
      ],
      advantages: [
        { title: "وصول فوري", body: "رابط للمتعاونين بلا تراخيص." },
        { title: "Hard Lock", body: "PDF نهائي غير قابل للتعديل." },
        { title: "تكلفة أقل", body: "قلّل مقاعد Acrobat للمهام البسيطة." },
      ],
      faqs: [
        { question: "كل ملفات Acrobat؟", answer: "PDF قياسي نعم؛ XFA ثقيل قد يحتاج Acrobat." },
        { question: "توقيع قانوني؟", answer: "راجع قوانين بلدك للامتثال." },
      ],
    },
  },
};
