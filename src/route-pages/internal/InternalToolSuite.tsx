"use client";

/**
 * QA-only harness — not linked from marketing nav.
 * Open manually: /{lang}/internal-tool-suite
 */
import { useCallback, useState } from "react";
import { InternalRouteGuard } from "@/components/internal/InternalRouteGuard";
import { PDFDocument } from "pdf-lib";
import * as XLSX from "xlsx";
import { mergePDFs } from "@/tools/merge-pdf/logic";
import { excelFileToPdf } from "@/tools/excel-to-pdf/logic";
import { pdfFileToExcel } from "@/tools/pdf-to-excel/logic";
import { withMinimumDuration, MIN_PROCESSING_DURATION_MS } from "@/tools/toolPipeline/registry";

type Line = { ok: boolean; text: string };

async function blobToFile(blob: Blob, name: string) {
  return new File([blob], name, { type: blob.type });
}

async function makeTinyPdf(label: string): Promise<File> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  page.drawText(`${label} rowA col1    rowA col2`, { x: 40, y: 340, size: 14 });
  page.drawText(`Row2 valX    valY`, { x: 40, y: 300, size: 14 });
  const bytes = await doc.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return blobToFile(new Blob([copy], { type: "application/pdf" }), `${label}.pdf`);
}

async function makeTinyXlsx(): Promise<File> {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Name", "Qty", "Price"],
    ["Widget", "2", "19.99"],
    ["Gadget", "1", "8.50"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
  const copy = new Uint8Array(out.byteLength);
  copy.set(out);
  return blobToFile(
    new Blob([copy], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "fixture.xlsx",
  );
}

export default function InternalToolSuite() {
  const [lines, setLines] = useState<Line[]>([]);

  const runAll = useCallback(async () => {
    setLines([]);
    const next: Line[] = [];

    const push = (text: string, ok: boolean) => next.push({ ok, text });

    try {
      const t0 = Date.now();
      await withMinimumDuration(Promise.resolve(true), MIN_PROCESSING_DURATION_MS);
      const dt = Date.now() - t0;
      push(`Minimum-duration wrapper ≥ ${MIN_PROCESSING_DURATION_MS}ms (actual ${dt}ms)`, dt >= MIN_PROCESSING_DURATION_MS);

      const xlsxFile = await makeTinyXlsx();
      const pdfBytes = await excelFileToPdf(xlsxFile);
      const head = new TextDecoder().decode(pdfBytes.slice(0, 5));
      push(`Excel → PDF (${pdfBytes.byteLength} bytes, starts %PDF)`, pdfBytes.byteLength > 500 && head.startsWith("%PDF"));

      const pdfFile = await makeTinyPdf("merge-a");
      const pdfFile2 = await makeTinyPdf("merge-b");
      const merged = await mergePDFs([pdfFile, pdfFile2]);
      push(`Merge PDF (pages merged, ${merged.byteLength} bytes)`, merged.byteLength > 800);

      const xlsxOut = await pdfFileToExcel(pdfFile);
      push(`PDF → Excel (${xlsxOut.byteLength} bytes .xlsx)`, xlsxOut.byteLength > 200);

      push("Sign PDF / Editor — covered manually (Fabric + canvas)", true);

      setLines(next);
    } catch (e) {
      push(`FAIL: ${e instanceof Error ? e.message : String(e)}`, false);
      setLines(next);
    }
  }, []);

  return (
    <InternalRouteGuard>
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Internal QA</p>
        <h1 className="text-2xl font-bold text-foreground mt-2">Tool pipeline smoke tests</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Not linked from the site menu. Validates Excel ↔ PDF, merge, timing wrapper, and synthetic fixtures.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void runAll()}
        className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
      >
        Run all checks
      </button>
      <ul className="space-y-2 font-mono text-sm">
        {lines.map((l, i) => (
          <li key={i} className={l.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
            {l.ok ? "✓" : "✗"} {l.text}
          </li>
        ))}
      </ul>
    </div>
    </InternalRouteGuard>
  );
}
