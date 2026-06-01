/**
 * Competitor + locale keyword map for content/alias decisions.
 * Sources: public SERP patterns (iLovePDF, Smallpdf, Sejda, PDF24, Adobe), Hindi/DE search phrasing.
 * Use for aliases, hub copy, compare pages — not for thin duplicate pages.
 */
export type LocaleKeywordRow = {
  locale: string;
  intent: string;
  canonicalTool: string;
  nativeQueries: string[];
  competitors: string[];
  priority: "P0" | "P1" | "P2";
};

export const LOCALE_KEYWORD_RESEARCH: LocaleKeywordRow[] = [
  {
    locale: "hi",
    intent: "merge",
    canonicalTool: "merge-pdf",
    nativeQueries: [
      "pdf merge online",
      "pdf jodna",
      "pdf milana",
      "pdf files merge karna",
      "ilovepdf alternative hindi",
    ],
    competitors: ["ilovepdf", "smallpdf", "pdf24", "sejda"],
    priority: "P0",
  },
  {
    locale: "hi",
    intent: "compress",
    canonicalTool: "compress-pdf",
    nativeQueries: [
      "pdf compress",
      "pdf size kam karna",
      "pdf compress karna online",
      "smallpdf free hindi",
    ],
    competitors: ["smallpdf", "ilovepdf", "11zon"],
    priority: "P0",
  },
  {
    locale: "hi",
    intent: "convert",
    canonicalTool: "pdf-to-word",
    nativeQueries: ["pdf to word", "pdf se word", "pdf word mein convert"],
    competitors: ["ilovepdf", "adobe acrobat"],
    priority: "P1",
  },
  {
    locale: "de",
    intent: "merge",
    canonicalTool: "merge-pdf",
    nativeQueries: [
      "pdf zusammenfügen",
      "pdfs zusammenfügen kostenlos",
      "pdf dateien zusammenfügen",
      "ilovepdf alternative",
    ],
    competitors: ["ilovepdf", "pdf24", "smallpdf"],
    priority: "P0",
  },
  {
    locale: "de",
    intent: "compress",
    canonicalTool: "compress-pdf",
    nativeQueries: [
      "pdf komprimieren",
      "pdf verkleinern",
      "pdf datei verkleinern online",
      "smallpdf alternative",
    ],
    competitors: ["smallpdf", "pdf24", "sejda"],
    priority: "P0",
  },
  {
    locale: "de",
    intent: "sign",
    canonicalTool: "sign-pdf",
    nativeQueries: ["pdf signieren", "pdf unterschreiben online"],
    competitors: ["adobe sign", "docusign", "smallpdf"],
    priority: "P1",
  },
  {
    locale: "es",
    intent: "merge",
    canonicalTool: "merge-pdf",
    nativeQueries: ["unir pdf", "combinar pdf online", "juntar pdf gratis"],
    competitors: ["ilovepdf", "smallpdf"],
    priority: "P0",
  },
  {
    locale: "fr",
    intent: "merge",
    canonicalTool: "merge-pdf",
    nativeQueries: ["fusionner pdf", "assembler pdf en ligne"],
    competitors: ["ilovepdf", "smallpdf"],
    priority: "P1",
  },
  {
    locale: "zh",
    intent: "merge",
    canonicalTool: "merge-pdf",
    nativeQueries: ["合并pdf", "pdf合并", "免费合并pdf"],
    competitors: ["ilovepdf", "smallpdf", "wps"],
    priority: "P0",
  },
  {
    locale: "ar",
    intent: "merge",
    canonicalTool: "merge-pdf",
    nativeQueries: ["دمج pdf", "دمج ملفات pdf"],
    competitors: ["ilovepdf", "smallpdf"],
    priority: "P1",
  },
  {
    locale: "en",
    intent: "privacy",
    canonicalTool: "merge-pdf",
    nativeQueries: [
      "merge pdf without uploading",
      "compress pdf browser",
      "ilovepdf alternative no signup",
      "smallpdf alternative secure",
    ],
    competitors: ["ilovepdf", "smallpdf", "sejda", "pdf24", "adobe"],
    priority: "P0",
  },
];

/** P0 rows drive alias expansion and compare CTAs first. */
export function getKeywordRowsByLocale(locale: string): LocaleKeywordRow[] {
  return LOCALE_KEYWORD_RESEARCH.filter((r) => r.locale === locale);
}
