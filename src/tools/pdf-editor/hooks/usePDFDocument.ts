import { useState, useCallback, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { acquirePdfDocument } from "@/lib/pdfjsClient";

export function usePDFDocument() {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<File | null>(null);

  const load = useCallback(async (file: File) => {
    setLoading(true);
    fileRef.current = file;
    try {
      const pdfDoc = await acquirePdfDocument(file);
      setPdf(pdfDoc);
      setPageCount(pdfDoc.numPages);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPage = useCallback(
    async (pageNum: number) => {
      if (!pdf) return null;
      return pdf.getPage(pageNum);
    },
    [pdf]
  );

  return {
    pdf,
    pageCount,
    loading,
    load,
    getPage,
    file: fileRef.current,
  };
}
