import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

type Meta = Pick<ToolRichSeo, "title" | "description" | "keywords">;

const ZH: Record<string, Meta> = {
  "rotate-pdf": {
    title: "在线旋转 PDF — 修正页面方向 | PDFTrusted",
    description: "在浏览器中旋转 PDF 页面，修正扫描件和横竖混排。",
    keywords: "旋转pdf, 翻转pdf页面, pdf方向",
  },
  "watermark-pdf": {
    title: "PDF 加水印 — 机密标记 | PDFTrusted",
    description: "为 PDF 添加文字水印，可调透明度与角度。",
    keywords: "pdf水印, 添加水印, 机密pdf",
  },
  "pdf-to-image": {
    title: "PDF 转 JPG/PNG — 图片导出 | PDFTrusted",
    description: "将 PDF 每页导出为图片，可调质量，浏览器处理。",
    keywords: "pdf转jpg, pdf转png, pdf转图片",
  },
  "page-numbers": {
    title: "PDF 添加页码 | PDFTrusted",
    description: "为报告和卷宗添加页码，位置与字体可设。",
    keywords: "pdf页码, 添加页码, 编号pdf",
  },
  "pdf-maker": {
    title: "在线制作 PDF — 文本生成 | PDFTrusted",
    description: "从文本快速生成 PDF，字体与行距可调。",
    keywords: "制作pdf, 文本转pdf, pdf生成器",
  },
  "pptx-to-pdf": {
    title: "PPT 转 PDF — PowerPoint | PDFTrusted",
    description: "将 PPTX 演示文稿转为 PDF 便于分享。",
    keywords: "ppt转pdf, powerpoint转pdf",
  },
  "generate-qr-code": {
    title: "免费二维码生成 — PNG/SVG | PDFTrusted",
    description: "为菜单、活动与 PDF 生成二维码，本地生成。",
    keywords: "二维码生成, 免费二维码, qr码",
  },
  "translate-pdf": {
    title: "PDF 提取文字 — 便于翻译 | PDFTrusted",
    description: "本地提取 PDF 文字，复制到您的翻译工具。",
    keywords: "pdf提取文字, 复制pdf文字",
  },
  "remove-watermark": {
    title: "去除水印 — 本地修复 | PDFTrusted",
    description: "淡化简单水印，浏览器处理，无云端生成式 AI。",
    keywords: "去除pdf水印, 去水印",
  },
  "hard-lock-pdf": {
    title: "PDF 硬锁定 — 不可编辑 | PDFTrusted",
    description: "将 PDF 栅格化为纯图像层，防止再编辑。",
    keywords: "锁定pdf, 扁平化pdf, 不可编辑pdf",
  },
  "repair-pdf": {
    title: "修复 PDF — 损坏文件 | PDFTrusted",
    description: "在浏览器中重建损坏的 PDF 结构。",
    keywords: "修复pdf, pdf损坏, 打不开pdf",
  },
  "redact-pdf": {
    title: "PDF 涂黑 — 敏感信息 | PDFTrusted",
    description: "对邮箱、卡号、电话等模式自动涂黑。",
    keywords: "pdf涂黑, 脱敏pdf, 隐藏敏感信息",
  },
  "pdf-to-html": {
    title: "PDF 转 HTML — 网页导出 | PDFTrusted",
    description: "将 PDF 文字导出为轻量 HTML。",
    keywords: "pdf转html, 导出网页",
  },
  "document-scanner": {
    title: "文档扫描 — 照片转 PDF | PDFTrusted",
    description: "裁剪、旋转、黑白滤镜，照片变清晰 PDF。",
    keywords: "扫描文档, 照片转pdf, 在线扫描",
  },
  "photo-resizer": {
    title: "照片压缩 — 精确 KB | PDFTrusted",
    description: "将证件照压缩到表单要求的 KB 大小。",
    keywords: "照片压缩kb, 证件照大小, 签证照片",
  },
  "resume-builder": {
    title: "简历制作 — 专业模板 | PDFTrusted",
    description: "精选模板、实时预览、PDF 导出，草稿仅存本地。",
    keywords: "简历制作, 在线简历, cv模板",
  },
  "professional-cv-maker": {
    title: "专业 CV 制作 | PDFTrusted",
    description: "企业风格模板，免费导出 PDF。",
    keywords: "专业简历, cv制作",
  },
  "government-resume-builder": {
    title: "公务简历模板 | PDFTrusted",
    description: "适合公职与正式申请的版式。",
    keywords: "公务员简历, 正式简历",
  },
  "ats-friendly-resume-builder": {
    title: "ATS 友好简历 | PDFTrusted",
    description: "单栏清晰结构，便于招聘系统解析。",
    keywords: "ats简历, 招聘系统简历",
  },
  "universal-converter": {
    title: "万能格式转换 | PDFTrusted",
    description: "PDF 与 Office 多格式一站式转换。",
    keywords: "文件转换, pdf转换器",
  },
  "jpg-to-pdf": {
    title: "JPG 转 PDF — 图片合并 | PDFTrusted",
    description: "将 JPG 照片合成 PDF，浏览器私密处理。",
    keywords: "jpg转pdf, 图片转pdf",
  },
  "png-to-pdf": {
    title: "PNG 转 PDF | PDFTrusted",
    description: "将 PNG（含透明）转为可分享 PDF。",
    keywords: "png转pdf",
  },
  "excel-to-pdf": {
    title: "Excel 转 PDF | PDFTrusted",
    description: "表格与报表转为固定版式 PDF。",
    keywords: "excel转pdf, xlsx转pdf",
  },
  "pdf-to-excel": {
    title: "PDF 转 Excel — 提取表格 | PDFTrusted",
    description: "将 PDF 表格导出为 XLSX。",
    keywords: "pdf转excel, 表格提取",
  },
  "pdf-to-pptx": {
    title: "PDF 转 PPT — PowerPoint | PDFTrusted",
    description: "从 PDF 恢复可编辑演示文稿。",
    keywords: "pdf转ppt, pdf转powerpoint",
  },
  "pdf-to-epub": {
    title: "PDF 转 EPUB 电子书 | PDFTrusted",
    description: "文字型 PDF 转为电子书格式。",
    keywords: "pdf转epub, 电子书转换",
  },
  "tools/ai-scanner": {
    title: "AI 扫描增强 — 透视校正 | PDFTrusted",
    description: "OpenCV.js 浏览器端校正与增强，不上传模型 API。",
    keywords: "文档扫描, 照片扫描增强",
  },
};

const AR: Record<string, Meta> = {
  "rotate-pdf": {
    title: "تدوير PDF عبر الإنترنت | PDFTrusted",
    description: "دوّر صفحات PDF 90° لإصلاح المسح والاتجاه.",
    keywords: "تدوير pdf, rotate pdf arabic",
  },
  "watermark-pdf": {
    title: "علامة مائية على PDF | PDFTrusted",
    description: "أضف علامة نصية مع التحكم في الشفافية.",
    keywords: "علامة مائية pdf, watermark arabic",
  },
  "pdf-to-image": {
    title: "PDF إلى JPG/PNG | PDFTrusted",
    description: "صدّر كل صفحة كصورة بجودة قابلة للضبط.",
    keywords: "pdf الى صورة, pdf to jpg arabic",
  },
  "page-numbers": {
    title: "ترقيم صفحات PDF | PDFTrusted",
    description: "أضف أرقام صفحات للتقارير والملفات الرسمية.",
    keywords: "ترقيم pdf, page numbers arabic",
  },
  "pdf-maker": {
    title: "إنشاء PDF من نص | PDFTrusted",
    description: "أنشئ PDF من النص فوراً مع خطوط قابلة للتعديل.",
    keywords: "انشاء pdf, text to pdf arabic",
  },
  "pptx-to-pdf": {
    title: "PowerPoint إلى PDF | PDFTrusted",
    description: "حوّل عروض PPTX إلى PDF للمشاركة.",
    keywords: "ppt الى pdf, powerpoint pdf",
  },
  "generate-qr-code": {
    title: "مولّد QR مجاني | PDFTrusted",
    description: "رموز QR للقوائم والحملات — PNG و SVG محلياً.",
    keywords: "qr code generator arabic",
  },
  "translate-pdf": {
    title: "استخراج نص PDF للترجمة | PDFTrusted",
    description: "استخراج محلي للنص — الصق في مترجمك.",
    keywords: "استخراج نص pdf, copy text pdf",
  },
  "remove-watermark": {
    title: "إزالة العلامة المائية | PDFTrusted",
    description: "تنعيم علامات بسيطة محلياً دون ذكاء اصطناعي سحابي.",
    keywords: "ازالة علامة مائية pdf",
  },
  "hard-lock-pdf": {
    title: "قفل PDF نهائي | PDFTrusted",
    description: "تسطيح PDF إلى صور فقط لمنع التعديل.",
    keywords: "قفل pdf, flatten pdf arabic",
  },
  "repair-pdf": {
    title: "إصلاح PDF التالف | PDFTrusted",
    description: "أعد بناء ملفات PDF المعطوبة في المتصفح.",
    keywords: "اصلاح pdf, repair pdf arabic",
  },
  "redact-pdf": {
    title: "تنقيح PDF — إخفاء البيانات | PDFTrusted",
    description: "مربعات سوداء على البريد والبطاقات والهاتف.",
    keywords: "تنقيح pdf, redact arabic",
  },
  "pdf-to-html": {
    title: "PDF إلى HTML | PDFTrusted",
    description: "صدّر نص PDF كصفحة ويب خفيفة.",
    keywords: "pdf to html arabic",
  },
  "document-scanner": {
    title: "ماسح مستندات — صورة إلى PDF | PDFTrusted",
    description: "قصّ وتدوير وفلتر أبيض وأسود للمستندات.",
    keywords: "مسح مستند, photo to pdf arabic",
  },
  "photo-resizer": {
    title: "ضغط الصورة بالكيلوبايت | PDFTrusted",
    description: "حجم دقيق بالـ KB للنماذج والتأشيرات.",
    keywords: "ضغط صورة kb, passport photo size",
  },
  "resume-builder": {
    title: "منشئ السيرة الذاتية | PDFTrusted",
    description: "قوالب احترافية ومعاينة مباشرة وتصدير PDF.",
    keywords: "سيرة ذاتية, cv maker arabic",
  },
  "professional-cv-maker": {
    title: "صانع CV احترافي | PDFTrusted",
    description: "قوالب شركات وتصدير PDF مجاني.",
    keywords: "cv professional arabic",
  },
  "government-resume-builder": {
    title: "سيرة للقطاع الحكومي | PDFTrusted",
    description: "تنسيق رسمي للطلبات الرسمية.",
    keywords: "government resume arabic",
  },
  "ats-friendly-resume-builder": {
    title: "سيرة متوافقة ATS | PDFTrusted",
    description: "تخطيط بسيط لأنظمة الفرز الآلي.",
    keywords: "ats resume arabic",
  },
  "universal-converter": {
    title: "محوّل ملفات شامل | PDFTrusted",
    description: "تحويل PDF وOffice في سير عمل واحد.",
    keywords: "file converter arabic, pdf converter",
  },
  "jpg-to-pdf": {
    title: "JPG إلى PDF | PDFTrusted",
    description: "اجمع الصور في PDF واحد بخصوصية المتصفح.",
    keywords: "jpg to pdf arabic",
  },
  "png-to-pdf": {
    title: "PNG إلى PDF | PDFTrusted",
    description: "حوّل PNG بشفافية إلى PDF واضح.",
    keywords: "png to pdf arabic",
  },
  "excel-to-pdf": {
    title: "Excel إلى PDF | PDFTrusted",
    description: "جداول وتقارير كـ PDF للمشاركة.",
    keywords: "excel to pdf arabic",
  },
  "pdf-to-excel": {
    title: "PDF إلى Excel | PDFTrusted",
    description: "استخراج الجداول إلى XLSX.",
    keywords: "pdf to excel arabic",
  },
  "pdf-to-pptx": {
    title: "PDF إلى PowerPoint | PDFTrusted",
    description: "استرجع شرائح قابلة للتحرير من PDF.",
    keywords: "pdf to ppt arabic",
  },
  "pdf-to-epub": {
    title: "PDF إلى EPUB | PDFTrusted",
    description: "كتب إلكترونية من PDF نصي.",
    keywords: "pdf to epub arabic",
  },
  "tools/ai-scanner": {
    title: "ماسح AI — تصحيح المنظور | PDFTrusted",
    description: "OpenCV.js محلياً دون رفع لخدمات الذكاء الاصطناعي.",
    keywords: "document scanner ai arabic",
  },
};

const FR: Record<string, Meta> = {
  "rotate-pdf": {
    title: "Pivoter PDF en ligne | PDFTrusted",
    description: "Faites pivoter les pages PDF à 90° dans le navigateur.",
    keywords: "pivoter pdf, rotation pdf gratuit",
  },
  "watermark-pdf": {
    title: "Filigrane PDF — Texte | PDFTrusted",
    description: "Ajoutez un filigrane texte avec opacité réglable.",
    keywords: "filigrane pdf, watermark pdf",
  },
  "pdf-to-image": {
    title: "PDF en JPG/PNG | PDFTrusted",
    description: "Exportez chaque page en image avec contrôle qualité.",
    keywords: "pdf en jpg, pdf en png",
  },
  "page-numbers": {
    title: "Numéroter un PDF | PDFTrusted",
    description: "Numéros de page pour rapports et dossiers.",
    keywords: "numeroter pdf, pagination pdf",
  },
  "pdf-maker": {
    title: "Créer un PDF depuis du texte | PDFTrusted",
    description: "Générez un PDF à partir de texte en ligne.",
    keywords: "creer pdf, texte en pdf",
  },
  "pptx-to-pdf": {
    title: "PowerPoint en PDF | PDFTrusted",
    description: "Convertissez PPTX en PDF pour partage.",
    keywords: "ppt en pdf, powerpoint pdf",
  },
  "generate-qr-code": {
    title: "Générateur QR gratuit | PDFTrusted",
    description: "Codes QR PNG/SVG générés localement.",
    keywords: "generateur qr code, qr gratuit",
  },
  "translate-pdf": {
    title: "Extraire le texte PDF | PDFTrusted",
    description: "Extraction locale — collez dans votre traducteur.",
    keywords: "extraire texte pdf, copier texte pdf",
  },
  "remove-watermark": {
    title: "Retirer filigrane — Réparation locale | PDFTrusted",
    description: "Atténue les filigranes simples sans IA cloud.",
    keywords: "enlever filigrane pdf",
  },
  "hard-lock-pdf": {
    title: "Verrouillage PDF — Aplatir | PDFTrusted",
    description: "PDF en images seules, non modifiable.",
    keywords: "verrouiller pdf, aplatir pdf",
  },
  "repair-pdf": {
    title: "Réparer un PDF corrompu | PDFTrusted",
    description: "Reconstruisez les PDF endommagés dans le navigateur.",
    keywords: "reparer pdf, pdf corrompu",
  },
  "redact-pdf": {
    title: "Caviarder un PDF | PDFTrusted",
    description: "Masquez e-mails, cartes et téléphones par motifs.",
    keywords: "caviardage pdf, redaction pdf",
  },
  "pdf-to-html": {
    title: "PDF en HTML | PDFTrusted",
    description: "Exportez le texte PDF en page web légère.",
    keywords: "pdf en html",
  },
  "document-scanner": {
    title: "Scanner de documents — Photo en PDF | PDFTrusted",
    description: "Recadrage, rotation et filtre N&B pour photos.",
    keywords: "scanner document en ligne, photo en pdf",
  },
  "photo-resizer": {
    title: "Redimensionner photo — Ko exact | PDFTrusted",
    description: "Taille fichier précise pour formulaires et visas.",
    keywords: "reduire photo ko, photo passeport",
  },
  "resume-builder": {
    title: "Créateur de CV professionnel | PDFTrusted",
    description: "Modèles premium, aperçu live, export PDF privé.",
    keywords: "creer cv, curriculum vitae en ligne",
  },
  "professional-cv-maker": {
    title: "CV professionnel en ligne | PDFTrusted",
    description: "Modèles corporate et PDF gratuit.",
    keywords: "cv professionnel gratuit",
  },
  "government-resume-builder": {
    title: "CV format officiel | PDFTrusted",
    description: "Mise en page formelle pour secteur public.",
    keywords: "cv fonction publique",
  },
  "ats-friendly-resume-builder": {
    title: "CV compatible ATS | PDFTrusted",
    description: "Structure simple pour logiciels de recrutement.",
    keywords: "cv ats, resume ats friendly",
  },
  "universal-converter": {
    title: "Convertisseur universel | PDFTrusted",
    description: "PDF et Office dans un seul flux.",
    keywords: "convertisseur pdf, convertisseur fichiers",
  },
  "jpg-to-pdf": {
    title: "JPG en PDF | PDFTrusted",
    description: "Assemblez des photos JPG en un PDF.",
    keywords: "jpg en pdf, image en pdf",
  },
  "png-to-pdf": {
    title: "PNG en PDF | PDFTrusted",
    description: "Convertissez PNG avec transparence en PDF.",
    keywords: "png en pdf",
  },
  "excel-to-pdf": {
    title: "Excel en PDF | PDFTrusted",
    description: "Tableurs et rapports en PDF partageable.",
    keywords: "excel en pdf, xlsx pdf",
  },
  "pdf-to-excel": {
    title: "PDF en Excel | PDFTrusted",
    description: "Extrayez les tableaux vers XLSX.",
    keywords: "pdf en excel, tableau pdf",
  },
  "pdf-to-pptx": {
    title: "PDF en PowerPoint | PDFTrusted",
    description: "Récupérez des diapositives éditables.",
    keywords: "pdf en ppt, pdf powerpoint",
  },
  "pdf-to-epub": {
    title: "PDF en EPUB | PDFTrusted",
    description: "Ebooks à partir de PDF textuels.",
    keywords: "pdf en epub, ebook",
  },
  "tools/ai-scanner": {
    title: "Scanner IA — Redressement | PDFTrusted",
    description: "OpenCV.js dans le navigateur, sans API cloud.",
    keywords: "scanner document ia",
  },
};

const DE: Record<string, Meta> = {
  "rotate-pdf": {
    title: "PDF drehen online | PDFTrusted",
    description: "PDF-Seiten um 90° drehen — Scans und Ausrichtung korrigieren.",
    keywords: "pdf drehen, seiten drehen pdf",
  },
  "watermark-pdf": {
    title: "PDF Wasserzeichen — Text | PDFTrusted",
    description: "Text-Wasserzeichen mit Deckkraft und Winkel.",
    keywords: "wasserzeichen pdf, pdf stempeln",
  },
  "pdf-to-image": {
    title: "PDF zu JPG/PNG | PDFTrusted",
    description: "Jede Seite als Bild exportieren, Qualität wählbar.",
    keywords: "pdf zu jpg, pdf zu png",
  },
  "page-numbers": {
    title: "PDF Seitenzahlen | PDFTrusted",
    description: "Seitennummern für Berichte und Akten.",
    keywords: "seitenzahlen pdf, pdf nummerieren",
  },
  "pdf-maker": {
    title: "PDF aus Text erstellen | PDFTrusted",
    description: "Schnell PDF aus Text im Browser erzeugen.",
    keywords: "pdf erstellen, text zu pdf",
  },
  "pptx-to-pdf": {
    title: "PowerPoint zu PDF | PDFTrusted",
    description: "PPTX-Präsentationen als PDF teilen.",
    keywords: "ppt zu pdf, powerpoint pdf",
  },
  "generate-qr-code": {
    title: "QR-Code Generator kostenlos | PDFTrusted",
    description: "QR-Codes als PNG/SVG — lokal generiert.",
    keywords: "qr code erstellen, qr generator",
  },
  "translate-pdf": {
    title: "PDF Text extrahieren | PDFTrusted",
    description: "Lokale Extraktion — in Übersetzer einfügen.",
    keywords: "text aus pdf kopieren",
  },
  "remove-watermark": {
    title: "Wasserzeichen entfernen | PDFTrusted",
    description: "Einfache Wasserzeichen lokal bearbeiten.",
    keywords: "wasserzeichen entfernen pdf",
  },
  "hard-lock-pdf": {
    title: "PDF Hard Lock — Unveränderbar | PDFTrusted",
    description: "PDF in reine Bildseiten umwandeln.",
    keywords: "pdf sperren, pdf flatten",
  },
  "repair-pdf": {
    title: "PDF reparieren | PDFTrusted",
    description: "Beschädigte PDFs im Browser wiederherstellen.",
    keywords: "pdf reparieren, defektes pdf",
  },
  "redact-pdf": {
    title: "PDF schwärzen | PDFTrusted",
    description: "E-Mails, Karten und Telefonnummern maskieren.",
    keywords: "pdf schwaerzen, redact pdf",
  },
  "pdf-to-html": {
    title: "PDF zu HTML | PDFTrusted",
    description: "PDF-Text als leichte Webseite exportieren.",
    keywords: "pdf zu html",
  },
  "document-scanner": {
    title: "Dokumentenscanner — Foto zu PDF | PDFTrusted",
    description: "Zuschneiden, drehen, S/W-Filter für Fotos.",
    keywords: "dokument scannen online, foto zu pdf",
  },
  "photo-resizer": {
    title: "Foto auf KB-Größe | PDFTrusted",
    description: "Exakte Dateigröße für Formulare und Visa.",
    keywords: "foto komprimieren kb, passfoto groesse",
  },
  "resume-builder": {
    title: "Lebenslauf erstellen | PDFTrusted",
    description: "Premium-Vorlagen, Live-Vorschau, PDF-Export.",
    keywords: "lebenslauf erstellen, cv maker",
  },
  "professional-cv-maker": {
    title: "Professioneller CV Maker | PDFTrusted",
    description: "Business-Vorlagen und kostenloses PDF.",
    keywords: "professioneller lebenslauf",
  },
  "government-resume-builder": {
    title: "Behörden-Lebenslauf | PDFTrusted",
    description: "Formelles Layout für öffentlichen Dienst.",
    keywords: "lebenslauf behoerde, amtlicher cv",
  },
  "ats-friendly-resume-builder": {
    title: "ATS-Lebenslauf | PDFTrusted",
    description: "Einfaches Layout für Bewerbermanagement.",
    keywords: "ats lebenslauf, bewerbung ats",
  },
  "universal-converter": {
    title: "Universal-Konverter | PDFTrusted",
    description: "PDF und Office in einem Workflow.",
    keywords: "datei konverter, pdf konverter",
  },
  "jpg-to-pdf": {
    title: "JPG zu PDF | PDFTrusted",
    description: "JPG-Fotos zu einem PDF zusammenführen.",
    keywords: "jpg zu pdf, bild zu pdf",
  },
  "png-to-pdf": {
    title: "PNG zu PDF | PDFTrusted",
    description: "PNG mit Transparenz in PDF umwandeln.",
    keywords: "png zu pdf",
  },
  "excel-to-pdf": {
    title: "Excel zu PDF | PDFTrusted",
    description: "Tabellen als festes PDF teilen.",
    keywords: "excel zu pdf, xlsx pdf",
  },
  "pdf-to-excel": {
    title: "PDF zu Excel | PDFTrusted",
    description: "Tabellen aus PDF nach XLSX extrahieren.",
    keywords: "pdf zu excel, tabelle pdf",
  },
  "pdf-to-pptx": {
    title: "PDF zu PowerPoint | PDFTrusted",
    description: "Bearbeitbare Folien aus PDF.",
    keywords: "pdf zu ppt, pdf powerpoint",
  },
  "pdf-to-epub": {
    title: "PDF zu EPUB | PDFTrusted",
    description: "E-Books aus textbasierten PDFs.",
    keywords: "pdf zu epub, ebook konverter",
  },
  "tools/ai-scanner": {
    title: "KI-Scanner — Entzerren | PDFTrusted",
    description: "OpenCV.js im Browser, keine Cloud-KI.",
    keywords: "dokument scanner ki",
  },
};

export const META_PHASE2_LOCALES: Record<string, Record<string, Partial<ToolRichSeo>>> = {
  zh: ZH,
  ar: AR,
  fr: FR,
  de: DE,
};
