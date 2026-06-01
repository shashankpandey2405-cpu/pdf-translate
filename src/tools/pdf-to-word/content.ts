export const content = {
  slug: "pdf-to-word",
  title: "PDF to Word — Convert PDF to DOCX Online",
  description:
    "Convert PDF to Word (DOCX) with layout-aware cloud processing or quick browser text export. Free PDF to Word converter.",
  hero: {
    title: "PDF to Word",
    subtitle:
      "Digital PDFs: quick browser export. Scans and complex layouts: Cloud Processing with PyMuPDF, pdf2docx, and OCR for editable DOCX.",
    badge: "Hybrid conversion",
  },
  steps: [
    {
      number: "01",
      title: "Upload your PDF",
      description: "We detect scanned vs text-based PDFs and recommend the best processing mode.",
    },
    {
      number: "02",
      title: "Convert",
      description:
        "Cloud mode uses pdf2docx, table recovery (Camelot/pdfplumber), and OCR for scans. Browser mode extracts text to RTF for simple documents.",
    },
    {
      number: "03",
      title: "Download Word file",
      description: "Download DOCX (cloud) or RTF (browser) — open in Microsoft Word or Google Docs.",
    },
  ],
  faqs: [
    {
      question: "What format does Cloud Processing produce?",
      answer:
        "Premium cloud conversion outputs editable .docx — layout preserved where possible, with text you can change in Word. Browser mode produces RTF for text-heavy PDFs.",
    },
    {
      question: "Will formatting be preserved?",
      answer:
        "Cloud processing targets Adobe/iLovePDF-quality layout preservation using pdf2docx and LibreOffice fallbacks. Simple browser mode is text-only.",
    },
    {
      question: "Does it work with scanned PDFs?",
      answer:
        "Yes — choose Cloud Processing. Scanned pages run through PaddleOCR or Tesseract preflight before DOCX reconstruction.",
    },
    {
      question: "Is the conversion secure?",
      answer:
        "Browser mode never uploads your file. Cloud mode uses encrypted staging and auto-deletes outputs per our retention policy.",
    },
  ],
  keywords: "pdf to word, convert pdf to word, pdf to docx free, pdf to docx, pdf converter",
};
