import { StandardFonts } from "pdf-lib";

export type MatchedStandardFont =
  | typeof StandardFonts.Helvetica
  | typeof StandardFonts.HelveticaBold
  | typeof StandardFonts.HelveticaOblique
  | typeof StandardFonts.HelveticaBoldOblique
  | typeof StandardFonts.TimesRoman
  | typeof StandardFonts.TimesRomanBold
  | typeof StandardFonts.TimesRomanItalic
  | typeof StandardFonts.TimesRomanBoldItalic
  | typeof StandardFonts.Courier
  | typeof StandardFonts.CourierBold
  | typeof StandardFonts.CourierOblique
  | typeof StandardFonts.CourierBoldOblique;

/** Map pdf.js / PDF font name substrings to closest pdf-lib Standard Font. */
export function matchPdfFontName(fontName?: string): MatchedStandardFont {
  const n = (fontName ?? "").toLowerCase();
  const bold = n.includes("bold") || n.includes("black") || n.includes("heavy");
  const italic = n.includes("italic") || n.includes("oblique");
  const serif = n.includes("times") || n.includes("serif") || n.includes("georgia");
  const mono = n.includes("courier") || n.includes("mono") || n.includes("consolas");

  if (mono) {
    if (bold && italic) return StandardFonts.CourierBoldOblique;
    if (bold) return StandardFonts.CourierBold;
    if (italic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  if (serif) {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold) return StandardFonts.TimesRomanBold;
    if (italic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (bold && italic) return StandardFonts.HelveticaBoldOblique;
  if (bold) return StandardFonts.HelveticaBold;
  if (italic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}
