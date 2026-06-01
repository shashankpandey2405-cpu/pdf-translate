/** Tesseract / OCRmyPDF language codes installed on the OCR worker image. */
export type TesseractLanguage = {
  code: string;
  label: string;
  native?: string;
};

export const TESSERACT_LANGUAGES: TesseractLanguage[] = [
  { code: "eng", label: "English", native: "English" },
  { code: "hin", label: "Hindi", native: "हिन्दी" },
  { code: "deu", label: "German", native: "Deutsch" },
  { code: "fra", label: "French", native: "Français" },
  { code: "spa", label: "Spanish", native: "Español" },
  { code: "ita", label: "Italian", native: "Italiano" },
  { code: "por", label: "Portuguese", native: "Português" },
  { code: "nld", label: "Dutch", native: "Nederlands" },
  { code: "pol", label: "Polish", native: "Polski" },
  { code: "rus", label: "Russian", native: "Русский" },
  { code: "ukr", label: "Ukrainian", native: "Українська" },
  { code: "ara", label: "Arabic", native: "العربية" },
  { code: "tur", label: "Turkish", native: "Türkçe" },
  { code: "vie", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "tha", label: "Thai", native: "ไทย" },
  { code: "jpn", label: "Japanese", native: "日本語" },
  { code: "kor", label: "Korean", native: "한국어" },
  { code: "chi_sim", label: "Chinese (Simplified)", native: "简体中文" },
  { code: "chi_tra", label: "Chinese (Traditional)", native: "繁體中文" },
  { code: "ben", label: "Bengali", native: "বাংলা" },
  { code: "tam", label: "Tamil", native: "தமிழ்" },
  { code: "tel", label: "Telugu", native: "తెలుగు" },
  { code: "mar", label: "Marathi", native: "मराठी" },
  { code: "guj", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kan", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "mal", label: "Malayalam", native: "മലയാളം" },
  { code: "pan", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "urd", label: "Urdu", native: "اردو" },
  { code: "fas", label: "Persian", native: "فارسی" },
  { code: "heb", label: "Hebrew", native: "עברית" },
  { code: "ell", label: "Greek", native: "Ελληνικά" },
  { code: "ces", label: "Czech", native: "Čeština" },
  { code: "swe", label: "Swedish", native: "Svenska" },
  { code: "dan", label: "Danish", native: "Dansk" },
  { code: "nor", label: "Norwegian", native: "Norsk" },
  { code: "fin", label: "Finnish", native: "Suomi" },
  { code: "ron", label: "Romanian", native: "Română" },
  { code: "hun", label: "Hungarian", native: "Magyar" },
  { code: "ind", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "msa", label: "Malay", native: "Bahasa Melayu" },
];

const ALIASES: Record<string, string> = {
  en: "eng",
  english: "eng",
  hi: "hin",
  hindi: "hin",
  de: "deu",
  german: "deu",
  deutsch: "deu",
  fr: "fra",
  french: "fra",
  es: "spa",
  spanish: "spa",
  it: "ita",
  italian: "ita",
  pt: "por",
  portuguese: "por",
  nl: "nld",
  dutch: "nld",
  pl: "pol",
  polish: "pol",
  ru: "rus",
  russian: "rus",
  ar: "ara",
  arabic: "ara",
  tr: "tur",
  turkish: "tur",
  vi: "vie",
  vietnamese: "vie",
  ja: "jpn",
  japanese: "jpn",
  ko: "kor",
  korean: "kor",
  zh: "chi_sim",
  chinese: "chi_sim",
  "chinese simplified": "chi_sim",
  "chinese traditional": "chi_tra",
  bn: "ben",
  bengali: "ben",
  ta: "tam",
  tamil: "tam",
  te: "tel",
  telugu: "tel",
  mr: "mar",
  marathi: "mar",
  gu: "guj",
  gujarati: "guj",
  pa: "pan",
  punjabi: "pan",
  ur: "urd",
  urdu: "urd",
  fa: "fas",
  persian: "fas",
  he: "heb",
  hebrew: "heb",
  el: "ell",
  greek: "ell",
};

export function normalizeOcrLanguage(input: string): string {
  const raw = (input || "eng").trim().toLowerCase();
  if (!raw) return "eng";
  if (ALIASES[raw]) return ALIASES[raw];
  const byCode = TESSERACT_LANGUAGES.find((l) => l.code === raw);
  if (byCode) return byCode.code;
  const byLabel = TESSERACT_LANGUAGES.find(
    (l) => l.label.toLowerCase() === raw || l.native?.toLowerCase() === raw,
  );
  if (byLabel) return byLabel.code;
  return raw.length <= 12 ? raw : "eng";
}

export function languageLabelForCode(code: string): string {
  const norm = normalizeOcrLanguage(code);
  return TESSERACT_LANGUAGES.find((l) => l.code === norm)?.label ?? norm;
}
