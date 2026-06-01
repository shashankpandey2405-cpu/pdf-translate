import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { runStableBrowserJob } from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";

export interface PageNumberOptions {
  position: "bottom-center" | "bottom-right" | "bottom-left" | "top-center";
  startAt: number;
  prefix: string;
  suffix: string;
  fontSize: number;
  margin: number;
}

export async function addPageNumbers(file: File, opts: PageNumberOptions): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
  const {
    position = "bottom-center",
    startAt = 1,
    prefix = "",
    suffix = "",
    fontSize = 11,
    margin = 24,
  } = opts;

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const num = i + startAt;
    const text = `${prefix}${num}${suffix}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x: number;
    let y: number;

    switch (position) {
      case "bottom-center":
        x = (width - textWidth) / 2;
        y = margin;
        break;
      case "bottom-right":
        x = width - textWidth - margin;
        y = margin;
        break;
      case "bottom-left":
        x = margin;
        y = margin;
        break;
      case "top-center":
        x = (width - textWidth) / 2;
        y = height - margin - fontSize;
        break;
      default:
        x = (width - textWidth) / 2;
        y = margin;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
  });
}

export function getNumberedFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + "_numbered.pdf";
}
