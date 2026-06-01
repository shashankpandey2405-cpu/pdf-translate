import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { runStableBrowserJob } from "@/lib/browserSafeProcessing";
import { stampTrustShieldMetadata } from "@/lib/trustShield/pdfMetadata";

export interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  color: "gray" | "red" | "blue" | "black";
  rotation: number;
  position: "center" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /**
   * Optional normalized anchor coordinate from live editor.
   * Values are in [0,1], relative to PDF page dimensions.
   */
  anchorX?: number;
  anchorY?: number;
}

const COLOR_MAP = {
  gray: rgb(0.5, 0.5, 0.5),
  red: rgb(0.85, 0.1, 0.1),
  blue: rgb(0.1, 0.3, 0.85),
  black: rgb(0, 0, 0),
};

export async function addWatermark(file: File, options: WatermarkOptions): Promise<Uint8Array> {
  return runStableBrowserJob(async () => {
  const { text, opacity, fontSize, color, rotation, position, anchorX, anchorY } = options;
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const textColor = COLOR_MAP[color] ?? COLOR_MAP.gray;

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x: number, y: number;

    if (
      typeof anchorX === "number" &&
      typeof anchorY === "number" &&
      Number.isFinite(anchorX) &&
      Number.isFinite(anchorY)
    ) {
      // Live-editor mode: anchor is center point in normalized PDF-space.
      const safeX = Math.min(1, Math.max(0, anchorX));
      const safeY = Math.min(1, Math.max(0, anchorY));
      x = safeX * width - textWidth / 2;
      y = safeY * height - textHeight / 2;
    } else {
      switch (position) {
        case "center":
          x = (width - textWidth) / 2;
          y = height / 2;
          break;
        case "top":
          x = (width - textWidth) / 2;
          y = height - textHeight - 50;
          break;
        case "bottom":
          x = (width - textWidth) / 2;
          y = textHeight + 50;
          break;
        case "top-left":
          x = 50;
          y = height - textHeight - 50;
          break;
        case "top-right":
          x = width - textWidth - 50;
          y = height - textHeight - 50;
          break;
        case "bottom-left":
          x = 50;
          y = textHeight + 50;
          break;
        case "bottom-right":
          x = width - textWidth - 50;
          y = textHeight + 50;
          break;
        default:
          x = (width - textWidth) / 2;
          y = height / 2;
      }
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: textColor,
      opacity,
      rotate: degrees(rotation),
    });
  }

  stampTrustShieldMetadata(pdfDoc);
  return pdfDoc.save();
  });
}

export function getWatermarkedFilename(file: File): string {
  return file.name.replace(/\.pdf$/i, "") + "_watermarked.pdf";
}
