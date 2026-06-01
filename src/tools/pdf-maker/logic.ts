import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";

export interface PDFMakerOptions {
  title?: string;
  content: string;
  fontSize: number;
  fontFamily: "helvetica" | "times" | "courier";
  lineHeight: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  bold: boolean;
  italic: boolean;
}

const FONT_MAP = {
  helvetica: StandardFonts.Helvetica,
  times: StandardFonts.TimesRoman,
  courier: StandardFonts.Courier,
};

const BOLD_FONT_MAP = {
  helvetica: StandardFonts.HelveticaBold,
  times: StandardFonts.TimesRoman, // Fallback to regular Times
  courier: StandardFonts.CourierBold,
};

const ITALIC_FONT_MAP = {
  helvetica: StandardFonts.HelveticaOblique,
  times: StandardFonts.TimesRoman, // Fallback to regular Times
  courier: StandardFonts.Courier,
};

export async function createPDFFromText(options: PDFMakerOptions): Promise<Uint8Array> {
  const {
    title,
    content,
    fontSize,
    fontFamily,
    lineHeight,
    margins,
    bold,
    italic,
  } = options;

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Select font based on style
  let fontName: StandardFonts;
  if (bold && italic) {
    // Use bold as fallback if bold-italic not available
    fontName = BOLD_FONT_MAP[fontFamily] || FONT_MAP[fontFamily];
  } else if (bold) {
    fontName = BOLD_FONT_MAP[fontFamily] || FONT_MAP[fontFamily];
  } else if (italic) {
    fontName = ITALIC_FONT_MAP[fontFamily] || FONT_MAP[fontFamily];
  } else {
    fontName = FONT_MAP[fontFamily];
  }

  const font = await pdfDoc.embedFont(fontName);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const maxWidth = width - margins.left - margins.right;

  let yPosition = height - margins.top;
  let currentPage = page;

  // Add title if provided
  const safeTitle = title?.trim() ?? "";
  if (safeTitle) {
    const titleSize = fontSize * 1.5;
    currentPage.drawText(safeTitle, {
      x: margins.left,
      y: yPosition,
      size: titleSize,
      font: titleFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= titleSize * lineHeight * 1.5;
  }

  // Split content into lines that fit the page width
  const words = content.split(/\s+/);
  let currentLine = "";
  const lines: string[] = [];

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Draw lines on pages
  for (const line of lines) {
    if (yPosition - fontSize * lineHeight < margins.bottom) {
      // Need new page
      currentPage = pdfDoc.addPage();
      yPosition = height - margins.top;
    }

    currentPage.drawText(line, {
      x: margins.left,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    yPosition -= fontSize * lineHeight;
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
}

export function getPDFMakerFilename(title: string): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
  return cleanTitle || "document";
}