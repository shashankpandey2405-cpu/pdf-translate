import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

const PRIVACY_HI =
  "ज़्यादातर टूल आपके ब्राउज़र में चलते हैं; क्लाउड प्रोसेसिंग होने पर फाइलें नीति के अनुसार स्वतः हटा दी जाती हैं।";

/** Hindi SEO overrides — top global tools (full meta + knowledge hub). */
export const HI_TOOL_SEO: Record<string, Partial<ToolRichSeo>> = {
  "merge-pdf": {
    title: "PDF मर्ज ऑनलाइन — फाइलें जोड़ें | PDFTrusted",
    description:
      "कई PDF और फोटो को एक फाइल में मिलाएँ। ब्राउज़र में सुरक्षित मर्ज, थंबनेल से क्रम बदलें, तुरंत डाउनलोड।",
    keywords: "pdf मर्ज, pdf जोड़ें, merge pdf online, combine pdf hindi, pdf merger free",
    bodyParagraphs: [
      "PDFTrusted से कई PDF और इमेज (PNG, JPG, WebP, HEIC) को एक दस्तावेज़ में मिलाएँ। थंबनेल खींचकर क्रम सेट करें, फिर एक PDF डाउनलोड करें।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "दो या अधिक PDF या फोटो ड्रॉप करें।" },
      { name: "क्रम", text: "थंबनेल खींचकर पेजों का क्रम तय करें।" },
      { name: "मर्ज", text: "मर्ज चलाएँ और अपनी PDF डाउनलोड करें।" },
    ],
    faqs: [
      { question: "क्या PDF मर्ज सुरक्षित है?", answer: PRIVACY_HI },
      { question: "कितनी PDF एक साथ?", answer: "मुफ्त टियर में कई फाइलें; बड़े बैच में डिवाइस पर निर्भर समय लग सकता है।" },
      { question: "फोटो भी मर्ज होती हैं?", answer: "हाँ — इमेज PDF पेज बनकर आपके चुने क्रम में जुड़ती हैं।" },
      { question: "अकाउंट ज़रूरी?", answer: "कोर मर्ज के लिए साइन-अप ज़रूरी नहीं।" },
    ],
  },
  "compress-pdf": {
    title: "PDF कंप्रेस ऑनलाइन — साइज़ कम करें | PDFTrusted",
    description: "ईमेल और शेयरिंग के लिए PDF का साइज़ कम करें। स्मार्ट प्रीसेट, ब्राउज़र में तेज़ प्रोसेसिंग।",
    keywords: "pdf compress, pdf size kam kare, compress pdf online hindi, shrink pdf",
    bodyParagraphs: [
      "PDF का फाइल साइज़ कम करें बिना डेस्कटॉप सॉफ्टवेयर के। स्तर चुनें और डाउनलोड से पहले परिणाम देखें।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "एक PDF चुनें।" },
      { name: "स्तर", text: "कंप्रेशन स्तर चुनें।" },
      { name: "डाउनलोड", text: "छोटी PDF सेव करें।" },
    ],
    faqs: [
      { question: "क्या टेक्स्ट धुंधला होगा?", answer: "डिजिटल PDF में टेक्स्ट आमतौर पर पढ़ने योग्य रहता है; स्कैन पर आर्टिफैक्ट बढ़ सकते हैं।" },
      { question: "पासवर्ड वाली PDF?", answer: "पहले अनलॉक टूल से प्रतिबंध हटाएँ।" },
      { question: "क्या मुफ्त है?", answer: "हाँ — ब्राउज़र मोड में कोर कंप्रेस मुफ्त।" },
    ],
  },
  "pdf-to-word": {
    title: "PDF से Word — DOCX कन्वर्ट | PDFTrusted",
    description: "PDF को संपादन योग्य Word (DOCX) में बदलें। स्कैन के लिए OCR वाला Trusted Pro विकल्प।",
    keywords: "pdf to word hindi, pdf se word, convert pdf docx, ocr pdf word",
    bodyParagraphs: [
      "PDF से टेक्स्ट और लेआउट निकालकर DOCX बनाएँ। साधारण PDF के लिए ब्राउज़र; स्कैन के लिए क्लाउड OCR बेहतर परिणाम देता है।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "PDF अपलोड करें।" },
      { name: "मोड", text: "Standard या Trusted Pro (OCR) चुनें।" },
      { name: "डाउनलोड", text: "DOCX फाइल सेव करें।" },
    ],
    faqs: [
      { question: "स्कैन की PDF?", answer: "Trusted Pro OCR से सर्चेबल टेक्स्ट और बेहतर Word लेआउट मिलता है।" },
      { question: "फॉर्मेटिंग सुरक्षित?", answer: "लेआउट जटिलता पर निर्भर; सरल दस्तावेज़ सबसे अच्छे निकलते हैं।" },
    ],
  },
  "word-to-pdf": {
    title: "Word से PDF — DOCX कन्वर्ट | PDFTrusted",
    description: "Word दस्तावेज़ को उच्च गुणवत्ता PDF में बदलें। लेआउट-फ्रेंडली क्लाउड कन्वर्शन।",
    keywords: "word to pdf hindi, docx to pdf, word pdf convert online",
    bodyParagraphs: [
      "DOCX/DOC फाइलें प्रिंट-रेडी PDF में बदलें। फॉन्ट और स्पेसिंग के लिए क्लाउड इंजन उपयोग होता है।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "Word फाइल चुनें।" },
      { name: "कन्वर्ट", text: "प्रोसेसिंग पूरी होने तक प्रतीक्षा करें।" },
      { name: "डाउनलोड", text: "PDF सेव करें।" },
    ],
    faqs: [
      { question: "कौन से फॉर्मेट?", answer: "DOCX और DOC (सीमित) समर्थित।" },
      { question: "क्या साइन-इन चाहिए?", answer: "क्लाउड कन्वर्शन के लिए अकाउंट आवश्यक हो सकता है।" },
    ],
  },
  "pdf-editor": {
    title: "PDF एडिटर ऑनलाइन — एनोटेट और एडिट | PDFTrusted",
    description: "ब्राउज़र में PDF एनोटेट, साइन, पेज रीऑर्डर और एक्सपोर्ट करें।",
    keywords: "pdf editor hindi, pdf edit online, annotate pdf, pdf editor free",
    bodyParagraphs: [
      "टेक्स्ट, हाइलाइट, पेन, इमेज और साइन जोड़ें। पेज थंबनेल से क्रम बदलें और PDF डाउनलोड करें।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "PDF खोलें।" },
      { name: "एडिट", text: "टूल चुनकर बदलाव करें।" },
      { name: "सेव", text: "अपडेटेड PDF डाउनलोड करें।" },
    ],
    faqs: [
      { question: "मोबाइल पर चलेगा?", answer: "आधुनिक मोबाइल ब्राउज़र पर बेसिक एडिटिंग काम करती है।" },
      { question: "क्या मुफ्त है?", answer: "कोर एडिटिंग मुफ्त; भारी क्लाउड जॉब्स के लिए लिमिट हो सकती है।" },
    ],
  },
  "sign-pdf": {
    title: "PDF साइन ऑनलाइन — ई-हस्ताक्षर | PDFTrusted",
    description: "PDF पर ड्रॉ या टाइप करके हस्ताक्षर जोड़ें। ब्राउज़र में निजी साइनिंग।",
    keywords: "sign pdf hindi, pdf par sign, esign pdf online, digital signature pdf",
    bodyParagraphs: [
      "ड्रॉ पैड या टाइप्ड सिग्नेचर से PDF पर हस्ताक्षर लगाएँ। पेज पर खींचकर स्थिति तय करें और डाउनलोड करें।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "PDF अपलोड करें।" },
      { name: "साइन", text: "हस्ताक्षर बनाएँ और पेज पर रखें।" },
      { name: "डाउनलोड", text: "साइन की गई PDF सेव करें।" },
    ],
    faqs: [
      { question: "क्या कानूनी रूप से मान्य?", answer: "उपयोग के संदर्भ पर निर्भर; महत्वपूर्ण अनुबंधों के लिए स्थानीय नियम देखें।" },
      { question: "इमेज सिग्नेचर?", answer: "हाँ — PNG/JPG अपलोड भी कर सकते हैं।" },
    ],
  },
  "ocr-pdf": {
    title: "OCR PDF — स्कैन से टेक्स्ट | PDFTrusted",
    description: "स्कैन की PDF को सर्चेबल बनाएँ। सुरक्षित क्लाउड OCR।",
    keywords: "ocr pdf hindi, scanned pdf text, pdf ocr online",
    bodyParagraphs: [
      "स्कैन और फोटो PDF से टेक्स्ट निकालें ताकि खोज और कॉपी आसान हो। क्लाउड OCR बेहतर सटीकता देता है।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "स्कैन PDF अपलोड करें।" },
      { name: "OCR", text: "क्लाउड प्रोसेसिंग शुरू करें।" },
      { name: "डाउनलोड", text: "सर्चेबल PDF लें।" },
    ],
    faqs: [
      { question: "कौन सी भाषाएँ?", answer: "कई भाषाएँ समर्थित; स्कैन गुणवत्ता परिणाम प्रभावित करती है।" },
      { question: "ब्राउज़र OCR?", answer: "यह टूल क्लाउड OCR पर केंद्रित है।" },
    ],
  },
  "split-pdf": {
    title: "PDF स्प्लिट — पेज निकालें | PDFTrusted",
    description: "चुने हुए पेजों को नई PDF में निकालें। थंबनेल से आसान चयन।",
    keywords: "split pdf hindi, pdf pages alag kare, extract pdf pages",
    bodyParagraphs: [
      "बड़ी PDF से सिर्फ ज़रूरी पेज निकालें और अलग फाइल डाउनलोड करें।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "PDF लोड करें।" },
      { name: "चयन", text: "पेज थंबनेल से चुनें।" },
      { name: "स्प्लिट", text: "नई PDF डाउनलोड करें।" },
    ],
    faqs: [
      { question: "अलग-अलग पेज?", answer: "हाँ — किसी भी संयोजन का चयन करें।" },
      { question: "क्या सुरक्षित?", answer: PRIVACY_HI },
    ],
  },
  "protect-pdf": {
    title: "PDF प्रोटेक्ट — पासवर्ड लगाएँ | PDFTrusted",
    description: "PDF पर पासवर्ड सुरक्षा लगाएँ। ब्राउज़र में एन्क्रिप्ट।",
    keywords: "protect pdf hindi, pdf password, encrypt pdf online",
    bodyParagraphs: [
      "संवेदनशील PDF को पासवर्ड से सुरक्षित करें। प्रोसेसिंग के बाद फाइलें आपके नियंत्रण में रहती हैं।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "PDF चुनें।" },
      { name: "पासवर्ड", text: "मज़बूत पासवर्ड सेट करें।" },
      { name: "डाउनलोड", text: "लॉक की गई PDF सेव करें।" },
    ],
    faqs: [
      { question: "पासवर्ड भूल गए?", answer: "एन्क्रिप्शन के बाद रिकवरी संभव नहीं — पासवर्ड सुरक्षित रखें।" },
    ],
  },
  "unlock-pdf": {
    title: "PDF अनलॉक — पासवर्ड हटाएँ | PDFTrusted",
    description: "PDF प्रतिबंध हटाएँ (जहाँ कानूनी रूप से अनुमत हो)।",
    keywords: "unlock pdf hindi, pdf password hataye, remove pdf password",
    bodyParagraphs: [
      "जहाँ आपके पास अधिकार हो, PDF से पासवर्ड या प्रतिबंध हटाकर एडिटिंग सक्षम करें।",
      PRIVACY_HI,
    ],
    howToSteps: [
      { name: "अपलोड", text: "लॉक PDF अपलोड करें।" },
      { name: "अनलॉक", text: "पासवर्ड दर्ज करें।" },
      { name: "डाउनलोड", text: "अनलॉक PDF लें।" },
    ],
    faqs: [
      { question: "क्या हमेशा काम करेगा?", answer: "मजबूत एन्क्रिप्शन वाली फाइलें असफल हो सकती हैं।" },
    ],
  },
};
