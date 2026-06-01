import type { TextItemPosition, PageInfo, PDFFormField } from "../types";
import { acquirePdfDocument } from "@/lib/pdfjsClient";

/**
 * Load a PDF file and return the PDF document proxy.
 */
export async function loadPDF(file: File) {
  return acquirePdfDocument(file);
}

/**
 * Get page count from a PDF file.
 */
export async function getPageCount(file: File): Promise<number> {
  const pdf = await loadPDF(file);
  return pdf.numPages;
}

/**
 * Get page info for all pages.
 */
export async function getPageInfos(file: File): Promise<PageInfo[]> {
  const pdf = await loadPDF(file);
  const infos: PageInfo[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    infos.push({
      pageNumber: i,
      rotation: page.rotate,
      width: viewport.width,
      height: viewport.height,
    });
  }
  return infos;
}

/**
 * Get text items with positions for a specific page.
 */
export async function getTextPositions(
  file: File,
  pageNumber: number
): Promise<TextItemPosition[]> {
  const pdf = await loadPDF(file);
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();

  const items: TextItemPosition[] = [];
  for (let i = 0; i < textContent.items.length; i++) {
    const item = textContent.items[i];
    if (!("str" in item)) continue;
    items.push({
      str: item.str,
      transform: item.transform,
      width: item.width,
      height: item.height,
      page: pageNumber - 1,
      itemIndex: i,
    });
  }
  return items;
}

/**
 * Render a single page to a canvas context.
 */
export async function renderPageToCanvas(
  file: File,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<void> {
  const pdf = await loadPDF(file);
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    viewport,
    canvas,
  }).promise;
}

/**
 * Detect form fields in a PDF.
 */
export async function detectFormFields(
  file: File
): Promise<PDFFormField[]> {
  void await loadPDF(file);

  const fields: PDFFormField[] = [];

  // Try to get form fields from pdf-lib or pdfjs-dist
  try {
    const pdfDoc = await loadPDF(file);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catalog = (pdfDoc as any).catalog;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acroForm = catalog.getAcroForm?.();
    if (acroForm) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldArray = acroForm.fields || [];
      for (const field of fieldArray) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rect = field.rect;
        if (rect && rect.length === 4) {
          fields.push({
            id: field.fieldName || `field-${Math.random().toString(36).slice(2)}`,
            type: "text",
            name: field.fieldName || "",
            value: field.value || "",
            rect: {
              x: rect[0],
              y: rect[1],
              width: rect[2] - rect[0],
              height: rect[3] - rect[1],
            },
            page: 0,
          });
        }
      }
    }
  } catch {
    // Fall back: no form fields detected
  }

  return fields;
}
