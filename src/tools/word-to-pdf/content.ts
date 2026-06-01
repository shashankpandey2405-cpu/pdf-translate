export const content = {
  slug: "word-to-pdf",
  title: "Word to PDF — Convert DOCX to PDF Online",
  description:
    "Convert Word documents to high-fidelity PDF with LibreOffice cloud processing. Preserves layout, fonts, and spacing.",
  hero: {
    title: "Word to PDF",
    subtitle:
      "Upload a Word file (.docx or .doc) and download a print-ready PDF with layout preserved via secure cloud conversion.",
    badge: "Layout preserved",
  },
  steps: [
    {
      number: "01",
      title: "Upload your document",
      description: "Drop a .docx or .doc file. Complex formatting is handled on our conversion workers.",
    },
    {
      number: "02",
      title: "Cloud conversion",
      description:
        "LibreOffice headless renders your document, then we normalize the PDF for reliable viewing and printing.",
    },
    {
      number: "03",
      title: "Download PDF",
      description: "Save the finished PDF — ready to share, print, or archive.",
    },
  ],
  faqs: [
    {
      question: "Which formats are supported?",
      answer: "Microsoft Word .docx and legacy .doc files, plus compatible OpenDocument formats when uploaded as Word.",
    },
    {
      question: "Will fonts and spacing match Word?",
      answer:
        "Cloud conversion uses LibreOffice with post-export PDF normalization. Most business documents match closely; exotic fonts may substitute if not installed on the worker.",
    },
    {
      question: "Is my file stored permanently?",
      answer: "No. Files are processed on secure workers and outputs expire per our enhanced processing policy.",
    },
  ],
  keywords: "word to pdf, docx to pdf, convert word to pdf, doc to pdf online",
};
