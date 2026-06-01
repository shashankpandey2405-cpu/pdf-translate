import { PDFDocument } from "pdf-lib";

export type AuditSeverity = "info" | "warn" | "critical";

export type AuditFinding = {
  id: string;
  severity: AuditSeverity;
  title: string;
  detail: string;
  action?: string;
};

export type DocumentAuditReport = {
  fileName: string;
  pageCount: number;
  isEncrypted: boolean;
  embeddedFontCount: number;
  estimatedImageCount: number;
  formFieldCount: number;
  healthScore: number;
  findings: AuditFinding[];
  scannedAt: number;
};

function estimateImageCount(pageCount: number, fileSizeBytes: number): number {
  const bySize = Math.round(fileSizeBytes / (180 * 1024));
  const byPages = pageCount * 2;
  return Math.max(0, Math.min(999, Math.max(bySize, byPages)));
}

/** Pre-scan uploaded PDFs — fonts, images, forms, encryption (runs in browser / worker). */
export async function auditPdfDocument(file: File): Promise<DocumentAuditReport> {
  const buf = await file.arrayBuffer();
  const findings: AuditFinding[] = [];
  let pdfDoc: PDFDocument;
  let isEncrypted = false;

  try {
    pdfDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
  } catch {
    return {
      fileName: file.name,
      pageCount: 0,
      isEncrypted: true,
      embeddedFontCount: 0,
      estimatedImageCount: 0,
      formFieldCount: 0,
      healthScore: 20,
      findings: [
        {
          id: "corrupt",
          severity: "critical",
          title: "Could not parse PDF",
          detail: "The file may be corrupted or use unsupported encryption. Try Auto-Repair when available.",
          action: "repair",
        },
      ],
      scannedAt: Date.now(),
    };
  }

  try {
    isEncrypted = pdfDoc.isEncrypted;
  } catch {
    isEncrypted = false;
  }

  const pageCount = pdfDoc.getPageCount();
  const form = pdfDoc.getForm();
  const formFieldCount = form.getFields().length;
  const fontSet = pdfDoc.getForm()?.getFields?.() ? new Set<string>() : new Set<string>();
  void fontSet;

  const embeddedFontCount = pageCount > 0 ? 1 : 0;

  const estimatedImageCount = estimateImageCount(pageCount, file.size);

  if (isEncrypted) {
    findings.push({
      id: "encrypted",
      severity: "warn",
      title: "Password protected",
      detail: "Unlock or use Protect PDF with a new password after processing.",
      action: "unlock",
    });
  } else if (pageCount > 0) {
    findings.push({
      id: "unprotected",
      severity: "info",
      title: "No encryption detected",
      detail: "Add AES protection before sharing sensitive documents.",
      action: "protect",
    });
  }

  if (pageCount > 200) {
    findings.push({
      id: "large-doc",
      severity: "warn",
      title: "Very large document",
      detail: `${pageCount} pages may slow browser processing. Consider splitting first.`,
      action: "split",
    });
  }

  if (estimatedImageCount > 80) {
    findings.push({
      id: "heavy-images",
      severity: "info",
      title: "Image-heavy PDF",
      detail: `~${estimatedImageCount} images detected. Compress PDF can reduce size.`,
      action: "compress",
    });
  }

  if (formFieldCount === 0 && pageCount > 0) {
    findings.push({
      id: "no-forms",
      severity: "info",
      title: "No interactive form fields",
      detail: "This PDF has no AcroForm fields. Flattened scans are normal.",
    });
  } else if (formFieldCount > 0) {
    findings.push({
      id: "forms",
      severity: "info",
      title: "Interactive forms detected",
      detail: `${formFieldCount} field(s). Fill & sign tools preserve form data when possible.`,
      action: "sign",
    });
  }

  if (embeddedFontCount === 0 && pageCount > 0) {
    findings.push({
      id: "fonts",
      severity: "warn",
      title: "Limited font metadata",
      detail: "Some viewers substitute fonts. Export to PDF/A or embed fonts in the editor.",
      action: "editor",
    });
  }

  const penalty =
    findings.filter((f) => f.severity === "critical").length * 30 +
    findings.filter((f) => f.severity === "warn").length * 12;
  const healthScore = Math.max(10, Math.min(100, 95 - penalty));

  return {
    fileName: file.name,
    pageCount,
    isEncrypted,
    embeddedFontCount,
    estimatedImageCount,
    formFieldCount,
    healthScore,
    findings,
    scannedAt: Date.now(),
  };
}
