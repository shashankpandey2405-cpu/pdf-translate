import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

const P = "تعمل معظم الأدوات في متصفحك؛ تُحذف ملفات السحابة تلقائياً وفق السياسة.";

/** Phase 3 — Arabic knowledge hub body, steps, FAQs. */
export const AR_TOOL_SEO_PHASE3: Record<string, Partial<ToolRichSeo>> = {
  "merge-pdf": {
    bodyParagraphs: [
      "ادمج عدة ملفات PDF وصور (PNG وJPG وWebP وHEIC) في ملف واحد. رتّب بالصور المصغرة ثم حمّل.",
      P,
    ],
    howToSteps: [
      { name: "رفع", text: "أسقط ملفين PDF أو أكثر أو صوراً." },
      { name: "ترتيب", text: "اسحب الصور المصغرة لضبط الترتيب." },
      { name: "دمج", text: "نفّذ الدمج وحمّل PDF." },
    ],
    faqs: [
      { question: "هل الدمج آمن؟", answer: P },
      { question: "كم ملفاً؟", answer: "عدة ملفات في المستوى المجاني؛ الدفعات الكبيرة تعتمد على ذاكرة الجهاز." },
      { question: "الصور أيضاً؟", answer: "نعم — تُحوَّل إلى صفحات PDF بالترتيب الذي تختاره." },
    ],
  },
  "compress-pdf": {
    bodyParagraphs: ["قلّص حجم PDF للبريد والمشاركة مع مستويات ضغط واضحة.", P],
    howToSteps: [
      { name: "رفع", text: "اختر PDF." },
      { name: "المستوى", text: "موصى به أو قوي." },
      { name: "تحميل", text: "احفظ الملف الأصغر." },
    ],
    faqs: [
      { question: "هل تتأثر الجودة؟", answer: "ملفات رقمية تبقى مقروءة؛ المسح قد يظهر تشويشاً عند الضغط القوي." },
      { question: "PDF بكلمة مرور؟", answer: "استخدم أداة فك القفل أولاً." },
    ],
  },
  "pdf-to-word": {
    bodyParagraphs: ["حوّل PDF ذا نص قابل للتحديد إلى مسودة قابلة للتحرير؛ المسح يحتاج OCR.", P],
    howToSteps: [
      { name: "رفع", text: "PDF نصي." },
      { name: "تحويل", text: "معالجة محلية أو سحابية." },
      { name: "تحميل", text: "افتح في Word." },
    ],
    faqs: [
      { question: "نفس التنسيق؟", answer: "التخطيطات المعقدة قد تتغير قليلاً." },
      { question: "مسح؟", answer: "استخدم OCR PDF." },
    ],
  },
  "word-to-pdf": {
    bodyParagraphs: ["حوّل Word إلى PDF للمشاركة مع الحفاظ على الجداول والصور قدر الإمكان.", P],
    howToSteps: [
      { name: "رفع", text: "ملف .docx." },
      { name: "تحويل", text: "عرض سحابي عالي الدقة." },
      { name: "تحميل", text: "احفظ PDF." },
    ],
    faqs: [{ question: "حساب مطلوب؟", answer: "التحويل السحابي يتطلب تسجيلاً؛ لا تُخزَّن الملفات طويلاً." }],
  },
  "pdf-editor": {
    bodyParagraphs: ["علّق وظلّل ووقّع وأعد ترتيب الصفحات في المتصفح مع Sign Pro وHard Lock.", P],
    howToSteps: [
      { name: "فتح", text: "ارفع PDF إلى مساحة العمل." },
      { name: "تحرير", text: "اختر أدوات النص والقلم والتوقيع." },
      { name: "حفظ", text: "صدّر PDF مسطحاً." },
    ],
    faqs: [
      { question: "ملفات سرية؟", answer: P },
      { question: "جوال؟", answer: "متصفحات حديثة مدعومة؛ الوضع الأفقي أفضل." },
    ],
  },
  "sign-pdf": {
    bodyParagraphs: ["ارسم أو اكتب أو ارفع توقيعاً وضعه بدقة على العقود والنماذج.", P],
    howToSteps: [
      { name: "رفع", text: "حمّل PDF للتوقيع." },
      { name: "توقيع", text: "أنشئ وضع التوقيع." },
      { name: "تحميل", text: "صدّر PDF موقّعاً." },
    ],
    faqs: [
      { question: "ملزم قانونياً؟", answer: "تختلف القوانين — راجع أنظمة التوقيع الإلكتروني محلياً." },
      { question: "خصوصية؟", answer: P },
    ],
  },
  "ocr-pdf": {
    bodyParagraphs: ["أضف طبقة نص قابلة للبحث لمسح PDF أو صدّر نصاً خاماً.", P],
    howToSteps: [
      { name: "رفع", text: "PDF ممسوح." },
      { name: "مخرجات", text: "PDF قابل للبحث أو TXT." },
      { name: "تحميل", text: "احفظ نتيجة OCR." },
    ],
    faqs: [{ question: "الدقة؟", answer: "تعتمد على وضوح المسح واللغة." }],
  },
  "split-pdf": {
    bodyParagraphs: ["اختر الصفحات بالصور المصغرة وصدّر PDF جديداً.", P],
    howToSteps: [
      { name: "رفع", text: "حمّل PDF." },
      { name: "اختيار", text: "حدد الصفحات." },
      { name: "تصدير", text: "حمّل PDF المقسّم." },
    ],
    faqs: [{ question: "الإشارات المرجعية؟", answer: "التركيز على محتوى الصفحات في الاستخراج الأساسي." }],
  },
  "protect-pdf": {
    bodyParagraphs: ["أضف كلمة مرور وصلاحيات لعقود وملفات حساسة.", P],
    howToSteps: [
      { name: "رفع", text: "اختر PDF." },
      { name: "كلمة المرور", text: "عيّن كلمة قوية." },
      { name: "تحميل", text: "احفظ PDF مشفّراً." },
    ],
    faqs: [{ question: "إلغاء الحماية؟", answer: "بكلمة المرور الصحيحة عبر أداة الفتح." }],
  },
  "unlock-pdf": {
    bodyParagraphs: ["أزل القيود عندما يكون لديك إذن وكلمة المرور الصحيحة.", P],
    howToSteps: [
      { name: "رفع", text: "PDF محمي." },
      { name: "كلمة المرور", text: "أدخلها." },
      { name: "فتح", text: "حمّل نسخة بلا قيود." },
    ],
    faqs: [{ question: "نسيت كلمة المرور؟", answer: "لا ضمان للاستعادة — اتصل بمالك الملف." }],
  },
  "rotate-pdf": {
    bodyParagraphs: ["صحّح المسح المقلوب والمزج بين عمودي وأفقي بزاوية 90°.", P],
    howToSteps: [
      { name: "رفع", text: "حمّل PDF." },
      { name: "تدوير", text: "اختر الصفحات." },
      { name: "حفظ", text: "حمّل PDF مصحّحاً." },
    ],
    faqs: [{ question: "خصوصية؟", answer: P }],
  },
  "watermark-pdf": {
    bodyParagraphs: ["علامة نصية قطرية للمسودات والمعاينات مع شفافية قابلة للضبط.", P],
    howToSteps: [
      { name: "رفع", text: "PDF." },
      { name: "إعداد", text: "نص ولون وشفافية." },
      { name: "تصدير", text: "حمّل PDF." },
    ],
    faqs: [{ question: "شعار؟", answer: "نص حالياً؛ للصور استخدم محرر PDF." }],
  },
  "pdf-to-image": {
    bodyParagraphs: ["صدّر كل صفحة JPG/PNG للعروض والشبكات.", P],
    howToSteps: [
      { name: "رفع", text: "PDF." },
      { name: "صيغة", text: "JPEG أو PNG." },
      { name: "تحميل", text: "احفظ الصور." },
    ],
    faqs: [{ question: "ملف كبير؟", answer: "قسّم PDF أولاً إذا بطأ المتصفح." }],
  },
  "page-numbers": {
    bodyParagraphs: ["ترقيم موحّد للتقارير والملفات الرسمية.", P],
    howToSteps: [
      { name: "رفع", text: "PDF." },
      { name: "إعداد", text: "الموضع والبداية." },
      { name: "تطبيق", text: "حمّل PDF مرقّماً." },
    ],
    faqs: [{ question: "التخطيط؟", answer: "الأرقام في الهوامش — اطبع عينة." }],
  },
  "pdf-maker": {
    bodyParagraphs: ["أنشئ PDF من النص دون Word.", P],
    howToSteps: [
      { name: "كتابة", text: "الصق أو اكتب." },
      { name: "نمط", text: "خط وتباعد." },
      { name: "PDF", text: "حمّل." },
    ],
    faqs: [{ question: "صور؟", answer: "استخدم محرر PDF." }],
  },
  "pptx-to-pdf": {
    bodyParagraphs: ["حوّل PPTX إلى PDF؛ الرسوم المتحركة تُسطَّح.", P],
    howToSteps: [
      { name: "رفع", text: ".pptx." },
      { name: "تحويل", text: "سحابة." },
      { name: "تحميل", text: "PDF." },
    ],
    faqs: [{ question: "الحركة؟", answer: "صفحات ثابتة في التصدير." }],
  },
  "generate-qr-code": {
    bodyParagraphs: ["رموز QR للقوائم والحملات — توليد محلي.", P],
    howToSteps: [
      { name: "محتوى", text: "رابط أو نص." },
      { name: "حجم", text: "بكسل." },
      { name: "تحميل", text: "PNG/SVG." },
    ],
    faqs: [{ question: "تتبع؟", answer: "لا يُرسل المحتوى للخادم عند التوليد." }],
  },
  "translate-pdf": {
    bodyParagraphs: ["استخراج محلي — الصق في مترجمك.", P],
    howToSteps: [
      { name: "رفع", text: "PDF بنص." },
      { name: "استخراج", text: "محلي." },
      { name: "نسخ", text: "حافظة أو RTF." },
    ],
    faqs: [{ question: "ترجمة تلقائية؟", answer: "لا — استخراج فقط." }],
  },
  "remove-watermark": {
    bodyParagraphs: ["تنعيم علامات بسيطة دون ذكاء اصطناعي سحابي.", P],
    howToSteps: [
      { name: "رفع", text: "PDF أو صورة." },
      { name: "قناع", text: "تلقائي أو يدوي." },
      { name: "تحميل", text: "النتيجة." },
    ],
    faqs: [{ question: "قانوني؟", answer: "ملفات تملك حق تعديلها فقط." }],
  },
  "hard-lock-pdf": {
    bodyParagraphs: ["تسطيح كل صفحة كصورة — لا تحرير للنص أو التوقيع.", P],
    howToSteps: [
      { name: "رفع", text: "النسخة النهائية." },
      { name: "قفل", text: "Hard Lock." },
      { name: "تحميل", text: "PDF ثابت." },
    ],
    faqs: [{ question: "عكس؟", answer: "لا — احتفظ بالأصل." }],
  },
  "repair-pdf": {
    bodyParagraphs: ["أصلح xref وأخطاء الصفحات الفارغة.", P],
    howToSteps: [
      { name: "رفع", text: "PDF تالف." },
      { name: "إصلاح", text: "في المتصفح." },
      { name: "تحميل", text: "نسخة مُصلحة." },
    ],
    faqs: [{ question: "دائماً كامل؟", answer: "تلف شديد قد يفقد محتوى." }],
  },
  "redact-pdf": {
    bodyParagraphs: ["تعتيم البريد والبطاقات والهاتف بأنماط.", P],
    howToSteps: [
      { name: "رفع", text: "PDF." },
      { name: "أنماط", text: "فعّل القواعد." },
      { name: "تحميل", text: "PDF منقّح." },
    ],
    faqs: [{ question: "دائم؟", answer: "نعم — راجع المخرجات." }],
  },
  "pdf-to-html": {
    bodyParagraphs: ["نص PDF كصفحة ويب خفيفة.", P],
    howToSteps: [
      { name: "رفع", text: "PDF." },
      { name: "تحويل", text: "محلي." },
      { name: "تحميل", text: ".html." },
    ],
    faqs: [{ question: "صور؟", answer: "يركز على النص." }],
  },
  "document-scanner": {
    bodyParagraphs: ["صورة إلى PDF نظيف للطلاب والإيصالات.", P],
    howToSteps: [
      { name: "صورة", text: "JPG/PNG." },
      { name: "تحسين", text: "قص وفلتر." },
      { name: "PDF", text: "تصدير محلي." },
    ],
    faqs: [{ question: "رفع؟", answer: "لا — محلي بالكامل." }],
  },
  "photo-resizer": {
    bodyParagraphs: ["ضغط صورة الهوية إلى KB المطلوب.", P],
    howToSteps: [
      { name: "رفع", text: "صورة." },
      { name: "KB", text: "الهدف." },
      { name: "تحميل", text: "احفظ." },
    ],
    faqs: [{ question: "جودة؟", answer: "توازن حتى الوصول للهدف." }],
  },
  "resume-builder": {
    bodyParagraphs: ["قوالب ومعاينة مباشرة وPDF؛ المسودة على جهازك فقط.", P],
    howToSteps: [
      { name: "قالب", text: "اختر." },
      { name: "ملء", text: "الأقسام." },
      { name: "PDF", text: "حمّل." },
    ],
    faqs: [{ question: "خادم؟", answer: "لا — localStorage فقط." }],
  },
  "professional-cv-maker": {
    bodyParagraphs: ["قوالب شركات وPDF مجاني.", P],
    howToSteps: [
      { name: "قالب", text: "تنفيذي." },
      { name: "محتوى", text: "خبرة." },
      { name: "تصدير", text: "PDF." },
    ],
    faqs: [{ question: "مجاني؟", answer: "نعم." }],
  },
  "government-resume-builder": {
    bodyParagraphs: ["تنسيق رسمي للقطاع العام.", P],
    howToSteps: [
      { name: "قالب", text: "رسمي." },
      { name: "بيانات", text: "كل الأقسام." },
      { name: "PDF", text: "حمّل." },
    ],
    faqs: [{ question: "صورة؟", answer: "اختياري." }],
  },
  "ats-friendly-resume-builder": {
    bodyParagraphs: ["عمود واحد وعناوين واضحة لأنظمة ATS.", P],
    howToSteps: [
      { name: "قالب", text: "ATS." },
      { name: "كلمات", text: "مهارات وخبرة." },
      { name: "PDF", text: "تصدير." },
    ],
    faqs: [{ question: "ما ATS؟", answer: "فلترة آلية لطلبات التوظيف." }],
  },
  "universal-converter": {
    bodyParagraphs: ["تحويل PDF وOffice في مسار واحد.", P],
    howToSteps: [
      { name: "صيغة", text: "دخل/خرج." },
      { name: "رفع", text: "ملف." },
      { name: "تحويل", text: "حمّل." },
    ],
    faqs: [{ question: "خصوصية؟", answer: P }],
  },
  "jpg-to-pdf": {
    bodyParagraphs: ["اجمع JPG في PDF واحد.", P],
    howToSteps: [
      { name: "JPG", text: "اختر." },
      { name: "ترتيب", text: "رتّب." },
      { name: "PDF", text: "حمّل." },
    ],
    faqs: [{ question: "خصوصية؟", answer: P }],
  },
  "png-to-pdf": {
    bodyParagraphs: ["PNG بشفافية إلى PDF.", P],
    howToSteps: [
      { name: "PNG", text: "رفع." },
      { name: "إنشاء", text: "PDF." },
      { name: "تحميل", text: "حفظ." },
    ],
    faqs: [{ question: "شفافية؟", answer: "رسم عالي الدقة." }],
  },
  "excel-to-pdf": {
    bodyParagraphs: ["جداول وتقارير كـ PDF ثابت.", P],
    howToSteps: [
      { name: "رفع", text: "Excel." },
      { name: "تحويل", text: "سحابة/متصفح." },
      { name: "PDF", text: "حمّل." },
    ],
    faqs: [{ question: "صيغ؟", answer: "PDF للعرض فقط — احتفظ بـ Excel." }],
  },
  "pdf-to-excel": {
    bodyParagraphs: ["جداول PDF إلى XLSX قابل للتصفية.", P],
    howToSteps: [
      { name: "PDF", text: "بجداول." },
      { name: "استخراج", text: "سحابة." },
      { name: "XLSX", text: "حمّل." },
    ],
    faqs: [{ question: "مسح؟", answer: "OCR أولاً." }],
  },
  "pdf-to-pptx": {
    bodyParagraphs: ["استرجع شرائح قابلة للتحرير من PDF.", P],
    howToSteps: [
      { name: "رفع", text: "PDF." },
      { name: "تحويل", text: "سحابة." },
      { name: "PPTX", text: "حمّل." },
    ],
    faqs: [{ question: "تصميم؟", answer: "شرائح بسيطة أفضل." }],
  },
  "pdf-to-epub": {
    bodyParagraphs: ["نص PDF ككتاب إلكتروني للشاشات الصغيرة.", P],
    howToSteps: [
      { name: "PDF", text: "نص رقمي." },
      { name: "EPUB", text: "سحابة." },
      { name: "قراءة", text: "في القارئ." },
    ],
    faqs: [{ question: "مسح؟", answer: "OCR أولاً." }],
  },
  "tools/ai-scanner": {
    bodyParagraphs: ["OpenCV.js للتصحيح والتحسين دون API ذكاء اصطناعي.", P],
    howToSteps: [
      { name: "صورة", text: "رفع." },
      { name: "خيارات", text: "منظور/تحسين." },
      { name: "تصدير", text: "PNG/PDF." },
    ],
    faqs: [{ question: "خط يد؟", answer: "تنظيف صورة فقط." }],
  },
};
