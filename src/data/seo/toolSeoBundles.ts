import { OCR_ACCURACY_NOTE, PRIVACY_BLURB } from "@/content/trustCopy";

export type ToolFaq = { question: string; answer: string };
export type HowToStep = { name: string; text: string };

export interface ToolRichSeo {
  title: string;
  description: string;
  keywords: string;
  /** ~200+ words total for Knowledge Hub */
  bodyParagraphs: string[];
  howToSteps: HowToStep[];
  faqs: ToolFaq[];
}

const SAFE = PRIVACY_BLURB;

const MERGE_BODY: string[] = [
  "Combine multiple PDFs and photos into one file. PNG, JPG, WebP, HEIC, and GIF images become PDF pages automatically. Reorder with thumbnails, then download a single PDF — browser mode keeps processing on your device when file size allows.",
  SAFE,
];

const COMPRESS_BODY: string[] = [
  "Reduce PDF file size for email and sharing. Pick a compression level and compare size before and after download. Digital text PDFs usually stay readable; scanned pages may show more artifacting at stronger settings.",
  SAFE,
];

function hub(
  title: string,
  description: string,
  keywords: string,
  bodyParagraphs: string[],
  howToSteps: HowToStep[],
  faqs: ToolFaq[]
): ToolRichSeo {
  return { title, description, keywords, bodyParagraphs, howToSteps, faqs };
}

export const TOOL_SEO_BUNDLES: Record<string, ToolRichSeo> = {
  "merge-pdf": hub(
    "Merge PDF Online — Combine Files | PDFTrusted",
    "Merge PDFs in your browser: reorder pages, combine multiple files, and download one PDF. Private processing when file size allows.",
    "free pdf merger, merge pdf online, combine pdf files, secure pdf merger, batch merge pdf, pdf joiner, pdftrusted exclusive features",
    MERGE_BODY,
    [
      { name: "Upload PDFs", text: "Drop two or more PDF files into the merge zone or use the file picker." },
      { name: "Reorder", text: "Drag thumbnails to set the exact order pages should appear in the final PDF." },
      { name: "Merge & download", text: "Click merge, wait for processing, then download your combined PDF." },
    ],
    [
      { question: "Is it safe to merge PDFs with PDFTrusted?", answer: SAFE },
      { question: "How many PDFs can I merge at once?", answer: "Free tier supports multiple files in one session; arrange them in order before merging. Large batches may take longer depending on your device." },
      { question: "Does merging reduce quality?", answer: "We combine existing page streams without re-encoding text when possible, preserving clarity for digital documents." },
      { question: "Can I merge without an account?", answer: "Yes — no sign-up is required for core merge workflows." },
      { question: "Can I merge photos (PNG, JPG)?", answer: "Yes — images are converted to PDF pages and merged in the order you choose." },
      { question: "Will merged PDFs work on mobile?", answer: "Output is standard PDF compatible with iOS, Android, and desktop readers." },
      { question: "What about very large PDFs or many files?", answer: "Under ~20MB many jobs stay fully local in the browser. Larger uploads may use short-lived Cloudflare R2 staging so the Worker can stream reliably; staged objects auto-expire within 24 hours." },
    ]
  ),
  "compress-pdf": hub(
    "Compress PDF Online — Shrink Files in Your Browser | PDFTrusted",
    "Compress PDF online free: reduce file size with browser presets or Turbo Cloud for stronger compression on large scans.",
    "compress pdf online, free pdf compressor, shrink pdf, reduce pdf file size, secure pdf compression, optimize pdf",
    COMPRESS_BODY,
    [
      { name: "Upload", text: "Choose one PDF to optimize." },
      { name: "Pick a level", text: "Select recommended, extreme, or lighter compression." },
      { name: "Download", text: "Save the smaller PDF to your device." },
    ],
    [
      { question: "Is it safe to upload PDFs to PDFTrusted?", answer: SAFE },
      { question: "Will compression make text blurry?", answer: "Higher compression recompresses streams; digital text PDFs usually stay readable while scans may show more artifacting." },
      { question: "Can I compress password-protected PDFs?", answer: "Unlock or decrypt first using our unlock tool if the file is restricted." },
      {
        question: "Is this an Adobe alternative?",
        answer:
          "PDFTrusted focuses on quick browser and cloud tasks. Advanced print workflows may still need desktop tools.",
      },
      { question: "Does compression work offline?", answer: "After the app loads, processing can continue without additional uploads because work stays local." },
      { question: "How are big PDFs handled?", answer: "Smaller files are often processed entirely in-browser. Larger ones may use temporary R2 staging that expires within 24 hours—see our privacy policy for details." },
      {
        question: "Browser vs Trusted Cloud compression — which is best?",
        answer:
          "Browser: fast, private, light metadata cleanup — not Ghostscript-level shrink. Trusted Cloud: Ghostscript + qpdf for real size reduction on image-heavy PDFs (free sign-in, daily quota).",
      },
    ]
  ),
  "split-pdf": hub(
    "Free PDF Splitter — Extract PDF Pages Online | PDFTrusted",
    "Split PDF online free: extract selected pages into a new PDF with thumbnails and secure browser processing. Fast PDF page extractor for legal and admin teams.",
    "split pdf online, extract pdf pages, pdf splitter free, separate pdf pages, secure pdf tools",
    [
      "Split PDF files online for free with PDFTrusted — extract only the pages you need from contracts, statements, or bundles. Visual thumbnails make selection precise, and downloads start as soon as processing completes.",
      "Use this free PDF splitter when you need to share a subset of pages without sending the entire document. Processing stays in your browser for a secure PDF workflow comparable to leading desktop utilities.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Add a single PDF to analyze page count." },
      { name: "Select pages", text: "Tap thumbnails to choose which pages to extract." },
      { name: "Split", text: "Run split and download the new PDF." },
    ],
    [
      { question: "Is splitting PDFs secure?", answer: SAFE },
      { question: "Can I extract non-contiguous pages?", answer: "Yes — pick any combination of pages before exporting." },
      { question: "Will links and bookmarks be preserved?", answer: "Basic extraction focuses on page content; complex bookmark trees may simplify." },
      { question: "Does it work on scanned PDFs?", answer: "Yes, though file size depends on embedded images." },
      { question: "Is there a page limit?", answer: "Very large files may be slower on older hardware; try compressing scans first if needed." },
    ]
  ),
  "extract-pages": hub(
    "Extract PDF Pages Online Free | PDFTrusted",
    "Extract selected PDF pages in your browser — private, fast, no server upload. Visual thumbnails and instant download.",
    "extract pdf pages, pdf page extractor, pull pages from pdf, browser pdf tools",
    [
      "Extract PDF pages online with PDFTrusted when you need only a section of a contract, invoice, or report. Choose pages visually and download a new PDF without cloud uploads.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Add your PDF." },
      { name: "Select", text: "Pick pages to keep in the new file." },
      { name: "Download", text: "Save the extracted PDF." },
    ],
    [
      { question: "Is extraction private?", answer: SAFE },
      { question: "Can I pick non-adjacent pages?", answer: "Yes — any combination of pages is supported." },
    ]
  ),
  "remove-pages": hub(
    "Remove PDF Pages Online Free | PDFTrusted",
    "Delete pages from a PDF in your browser. Mark pages to remove and download a shorter file — secure local processing.",
    "remove pdf pages, delete pdf pages, trim pdf online",
    [
      "Remove PDF pages you do not need — blank sheets, duplicates, or appendix material — while keeping the rest of the document intact. Processing runs locally in your browser.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Add your PDF." },
      { name: "Mark", text: "Select pages to delete." },
      { name: "Download", text: "Get the trimmed PDF." },
    ],
    [
      { question: "Must one page remain?", answer: "Yes — you cannot delete every page." },
      { question: "Is it secure?", answer: SAFE },
    ]
  ),
  "organize-pdf": hub(
    "Organize PDF Pages — Reorder Online Free | PDFTrusted",
    "Reorder PDF pages with drag and drop in your browser. Organize contracts and decks without uploading to a server.",
    "organize pdf pages, reorder pdf, sort pdf pages online",
    [
      "Organize PDF page order for presentations, signed packets, and scanned bundles. Drag thumbnails into the sequence you need and export a new PDF privately in the browser.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Add your PDF." },
      { name: "Reorder", text: "Drag pages into the right sequence." },
      { name: "Download", text: "Save the reorganized PDF." },
    ],
    [
      { question: "Does drag reorder change the whole file?", answer: "Yes — a new PDF is built in your chosen order." },
      { question: "Is processing local?", answer: SAFE },
    ]
  ),
  "rotate-pdf": hub(
    "Rotate PDF Online Free — Fix Page Orientation | PDFTrusted",
    "Rotate PDF pages in your browser: fix landscape pages, correct scans, and export instantly. Secure PDF rotation tool — no upload servers.",
    "rotate pdf online, fix pdf orientation, rotate pages free, pdf editor rotate",
    [
      "Rotate PDF online free with PDFTrusted to fix upside-down scans, mixed portrait/landscape decks, and presentation exports. Apply per-page angles or bulk selections before downloading a corrected PDF.",
      "This secure PDF rotation workflow keeps documents local while you adjust thumbnails, helping compliance-minded teams avoid unnecessary cloud copies.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Load the PDF you need to fix." },
      { name: "Rotate", text: "Select pages and apply 90° rotations until the layout matches print direction." },
      { name: "Save", text: "Download the rotated PDF." },
    ],
    [
      { question: "Is rotating PDFs private?", answer: SAFE },
      { question: "Can I rotate only some pages?", answer: "Yes — multi-select pages before applying rotation." },
      { question: "Will form fields break?", answer: "Simple rotations preserve most digital PDFs; test critical forms after export." },
      { question: "Does it work on phones?", answer: "Yes — use a modern mobile browser for best touch performance." },
      { question: "Is PDFTrusted free?", answer: "Core rotation and other standard tools are free to use in the browser." },
    ]
  ),
  "unlock-pdf": hub(
    "Unlock PDF Online — Remove PDF Password Free | PDFTrusted",
    "Unlock PDF files in your browser: remove known passwords and restrictions when you have permission. Secure PDF unlocker for forgotten passwords on owned documents.",
    "unlock pdf online, remove pdf password, pdf password remover, decrypt pdf",
    [
      "Unlock PDF online when you have legitimate access to the password or owner key. PDFTrusted decrypts locally so sensitive HR, finance, or legal PDFs are not uploaded to unknown clouds.",
      "Use this secure PDF unlock workflow for password-protected invoices, archived contracts, or legacy forms — always respect copyright and local laws before removing encryption.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Choose the protected PDF." },
      { name: "Enter password", text: "Provide the password if prompted." },
      { name: "Unlock", text: "Download an unlocked copy when processing succeeds." },
    ],
    [
      { question: "Can PDFTrusted unlock any PDF?", answer: "Only when you supply the correct password and have rights to modify the file." },
      { question: "Is unlocking secure?", answer: SAFE },
      { question: "Will signatures remain valid?", answer: "Removing security may invalidate some digital signatures; keep originals archived." },
      { question: "What if I forgot the password?", answer: "Recovery is not guaranteed; contact the document owner or use legal recovery channels." },
      { question: "Does unlocking work offline?", answer: "After load, processing is local in the browser tab." },
    ]
  ),
  "watermark-pdf": hub(
    "Add Watermark to PDF Free — Brand Documents Online | PDFTrusted",
    "Watermark PDF online: add text watermarks, adjust opacity, and protect drafts. Free PDF watermark tool with private browser rendering.",
    "watermark pdf online, add watermark to pdf, confidential stamp pdf, brand pdf",
    [
      "Add watermark to PDF files for confidential drafts, client previews, and internal approvals. PDFTrusted renders text diagonally across pages with adjustable opacity so readers know the status of each document.",
      "This free PDF watermark workflow runs locally, pairing well with merge and compress tools for a complete secure PDF toolkit.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Load the PDF to watermark." },
      { name: "Customize", text: "Set text, color, rotation, and opacity." },
      { name: "Export", text: "Download the watermarked PDF." },
    ],
    [
      { question: "Is watermarking safe for NDAs?", answer: SAFE },
      { question: "Can I remove watermarks later?", answer: "Use our remove-watermark tool only on files you own and where policy allows." },
      { question: "Will watermarks print?", answer: "Yes — they are embedded into the page content for export." },
      { question: "Does it support logos?", answer: "Text watermarks ship today; image branding is available in the PDF editor workspace." },
      { question: "Is PDFTrusted free?", answer: "Core watermarking is free in supported browsers." },
    ]
  ),
  "pdf-to-image": hub(
    "PDF to JPG / PNG Converter — Free Online | PDFTrusted",
    "Convert PDF to image online: export every page to JPG or PNG with quality controls. Fast PDF to image converter — secure local processing.",
    "pdf to jpg, pdf to png, convert pdf to image, free pdf converter",
    [
      "Convert PDF to JPG or PNG for presentations, social posts, and CMS uploads. PDFTrusted walks each page through a canvas pipeline so you can pick standard or high resolution before batch downloading images.",
      "This free online PDF converter focuses on privacy-first rendering — ideal when marketing teams cannot upload unreleased decks to third parties.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Choose a PDF to rasterize." },
      { name: "Choose format", text: "Pick JPEG or PNG and quality preset." },
      { name: "Convert", text: "Download images page by page or in sequence." },
    ],
    [
      { question: "Is PDF to image conversion private?", answer: SAFE },
      { question: "Will colors match print?", answer: "Screen RGB exports may differ from CMYK print — proof critical packaging separately." },
      { question: "Can I convert large PDFs?", answer: "Performance depends on RAM; split huge files first if the browser slows." },
      { question: "Does OCR run automatically?", answer: "This tool rasterizes pages; use OCR workflows for editable text extraction." },
      { question: "Is there a daily limit?", answer: "Browser limits apply; premium messaging may appear for heavy usage." },
    ]
  ),
  "page-numbers": hub(
    "Add Page Numbers to PDF Free — Online PDF Stamping | PDFTrusted",
    "Number PDF pages online: choose position, prefix/suffix, and font size. Secure PDF page numbering for reports and filings.",
    "add page numbers to pdf, bates numbering alternative, pdf page numbers online",
    [
      "Add page numbers to PDF documents for court bundles, ISO manuals, and board packs. PDFTrusted stamps consistent numbering across every page with controls for margins and typography.",
      "Pair this secure PDF page numbering tool with merge and watermark utilities for publication-ready PDFs without desktop licenses.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Load the PDF that needs numbering." },
      { name: "Configure", text: "Pick position, start number, prefix, suffix, and font size." },
      { name: "Apply", text: "Download the numbered PDF." },
    ],
    [
      { question: "Will numbering shift layout?", answer: "Numbers render in margins; verify print proofs for tight layouts." },
      { question: "Is it safe?", answer: SAFE },
      { question: "Can I start at page 0?", answer: "Set start values to match your style guide." },
      { question: "Does it support Roman numerals?", answer: "Use prefix/suffix fields creatively; dedicated Roman presets may arrive later." },
      { question: "Works on Mac Safari?", answer: "Yes on current Safari versions with similar performance to Chrome." },
    ]
  ),
  "pdf-maker": hub(
    "Free PDF Maker — Create PDF from Text Online | PDFTrusted",
    "Create PDF from text in your browser: choose fonts, line spacing, and export instantly. Free PDF maker for proposals and notes.",
    "create pdf from text, pdf maker online, text to pdf, free pdf creator",
    [
      "Create PDF from text without Word or Google Docs. PDFTrusted formats paragraphs, headings, and emphasis so freelancers can ship invoices, statements of work, and quick briefs as lightweight PDFs.",
      "This free PDF maker complements our secure PDF editor for teams that need both structured authoring and mark-up workflows.",
      SAFE,
    ],
    [
      { name: "Write", text: "Paste or type your content." },
      { name: "Style", text: "Adjust fonts, size, and spacing." },
      { name: "Export", text: "Generate and download the PDF." },
    ],
    [
      { question: "Is PDF creation private?", answer: SAFE },
      { question: "Can I embed images?", answer: "Use the PDF editor for image-heavy layouts." },
      { question: "Does it support Unicode?", answer: "Modern browsers render many scripts; verify complex scripts manually." },
      { question: "Can I print directly?", answer: "Use the browser print dialog after opening the downloaded PDF." },
      { question: "Is there a template library?", answer: "Start blank today; combine with editor components for richer layouts." },
    ]
  ),
  "word-to-pdf": hub(
    "Word to PDF Online — DOCX to PDF Free | PDFTrusted",
    "Convert Word documents to PDF with secure cloud processing. Layout-friendly output via Gotenberg/LibreOffice on Premium cloud.",
    "word to pdf, docx to pdf online, convert word to pdf free, office to pdf",
    [
      "Turn DOCX and Word files into shareable PDFs. Free browser staging is not used for Office conversion — sign in and run Premium cloud for reliable fonts, tables, and images.",
      "Ideal for resumes, reports, and contracts you need to email as PDF. Files are processed on isolated workers and removed automatically within 24 hours.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Select a .docx or Word file." },
      { name: "Cloud convert", text: "Premium cloud renders the document to PDF with high fidelity." },
      { name: "Download", text: "Save the PDF to your device." },
    ],
    [
      { question: "Is Word to PDF secure?", answer: SAFE },
      { question: "Do I need an account?", answer: "Premium cloud conversion requires sign-in; files are not kept as a personal library." },
      { question: "Will fonts match?", answer: "Cloud engines preserve most standard fonts; exotic fonts may substitute if not embedded in the source." },
      { question: "Maximum file size?", answer: "Up to 50MB on Premium cloud per our tool limits." },
      { question: "Does it work on mobile?", answer: "Yes — upload from phone, download PDF when processing completes." },
    ],
  ),
  "pptx-to-pdf": hub(
    "PPT to PDF Online — PowerPoint to PDF | PDFTrusted",
    "Convert PowerPoint (PPTX) to PDF with Premium cloud processing. Slides, fonts, and images preserved for sharing.",
    "pptx to pdf, powerpoint to pdf online, convert ppt to pdf, presentation to pdf",
    [
      "Export presentations as PDF for clients and classrooms. PPTX conversion runs on secure cloud workers — not in the browser — for accurate slide layout.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Choose a .pptx presentation." },
      { name: "Convert", text: "Cloud workers render slides to a single PDF." },
      { name: "Download", text: "Save and share the PDF." },
    ],
    [
      { question: "Are animations preserved?", answer: "PDF export captures slide appearance; animations and transitions are flattened to static pages." },
      { question: "Is processing private?", answer: SAFE },
      { question: "Can I convert on iPhone?", answer: "Yes — use Safari or Chrome and download when ready." },
      { question: "File limits?", answer: "Follow on-screen Premium cloud size limits (typically up to 50MB)." },
      { question: "Google Slides?", answer: "Export from Slides as PPTX first, then upload here." },
    ],
  ),
  "pdf-to-word": hub(
    "PDF to Word Converter Online — Extract Text Free | PDFTrusted",
    "Convert PDF to Word-compatible RTF: extract digital text quickly with a secure PDF to Word pipeline. Best for editable drafts — private browser conversion.",
    "pdf to word online, convert pdf to word free, extract text from pdf, secure pdf converter",
    [
      "Convert PDF to Word-friendly RTF output for quick edits in Microsoft Word or Google Docs. PDFTrusted targets digital-born PDFs with selectable text; scanned pages may need OCR for accuracy.",
      "This secure PDF to Word alternative keeps conversions local, helping regulated industries avoid unnecessary data residency risks.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Select a text-based PDF." },
      { name: "Convert", text: "Run conversion and monitor progress." },
      { name: "Download", text: "Save the RTF output and open in Word." },
    ],
    [
      { question: "Will layout match exactly?", answer: "Complex layouts may shift; PDF is not a native Word format." },
      { question: "Is conversion secure?", answer: SAFE },
      { question: "Does OCR run automatically?", answer: "Scanned PDFs require dedicated OCR; this path extracts embedded text." },
      { question: "Can I batch convert?", answer: "Use supported batch routes where available in the toolkit." },
      { question: "Is PDFTrusted free?", answer: "Core conversion features are free in-browser." },
      {
        question: "Browser RTF vs Cloud DOCX — what should I use?",
        answer:
          "Browser exports RTF text quickly without upload — best for digital PDFs. Trusted Cloud outputs DOCX with layout preservation and OCR for scans (sign in free).",
      },
    ]
  ),
  "pdf-editor": hub(
    "PDF Editor Online — Annotate & Edit in Your Browser | PDFTrusted",
    "Edit PDF online free: add text, draw, highlight, merge pages, compress, and rearrange. Full-featured document editor with Sign Pro — fast PDF workflow in your browser.",
    "pdf editor online, annotate pdf free, secure pdf editor, edit pdf without upload, pdftrusted exclusive features",
    [
      "Edit PDF online with PDFTrusted's proprietary pdftrusted-editor™: annotate contracts, highlight policy changes, insert signatures, and reorganize pages using our exclusive in-house technology. The editor pairs vector tools with raster previews so teams can collaborate faster while files remain on-device.",
      "Features include text boxes, shapes, whiteout, image stamps, page master actions, and Sign Pro for draw/type/photo signatures. Combine with merge and compress modules for an end-to-end free PDF toolkit featuring pdftrusted.com exclusive features.",
      SAFE,
    ],
    [
      { name: "Open a PDF", text: "Upload a file to enter the live workspace." },
      { name: "Choose a tool", text: "Switch between text, pen, highlight, image, signature, and master PDF actions." },
      { name: "Save", text: "Export a flattened PDF with your edits embedded." },
    ],
    [
      { question: "Is the PDF editor safe for confidential files?", answer: SAFE },
      { question: "Can I replace existing text?", answer: "Use the content-edit flow for supported digital PDFs; scans may need OCR first." },
      { question: "Does Sign Pro support typed signatures?", answer: "Yes — choose draw, type script, or upload a transparent PNG." },
      { question: "Will edits work in Adobe Reader?", answer: "Exported PDFs follow the PDF spec and open in Reader, Preview, and Chrome using our proprietary pdftrusted-rendering™ engine." },
      { question: "Can I use it on iPad?", answer: "Yes — use Safari or Chrome; enable landscape for wider toolbars." },
      { question: "Do my PDFs get uploaded to a server?", answer: "Many edits run locally. Larger files or certain flows may use short-lived Cloudflare R2 staging; those copies are purged automatically within 24 hours." },
    ]
  ),
  "sign-pdf": hub(
    "Sign PDF Online Free — E-Signature & Secure Download | PDFTrusted",
    "Sign PDF documents in your browser: draw, type, or upload signatures and flatten with PDFTrusted Core. Secure PDF signer for contracts and forms.",
    "sign pdf online, esign pdf free, digital signature pdf, add signature to pdf",
    [
      "Sign PDF online with PDFTrusted’s streamlined workspace built on the same rendering engine as our editor. Place signatures precisely, manage multiple image stamps, and export a flattened PDF ready for counterparties.",
      "Draw signatures with smooth strokes, type elegant script, or upload a photo — each mode is tuned for mobile and desktop. This secure PDF signer keeps keys and documents off cloud queues you do not control.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Load the PDF you need to sign." },
      { name: "Add signature", text: "Open Sign Pro, create your signature, and place it on the page." },
      { name: "Download", text: "Export the signed PDF." },
    ],
    [
      { question: "Are PDFTrusted signatures legally binding?", answer: "Laws vary by country; PDFTrusted provides cryptographic flattening but not certificate-based PKI." },
      { question: "Is signing private?", answer: SAFE },
      { question: "Can I remove a signature?", answer: "Clear annotations before download or re-open the original file." },
      { question: "Does it support initials?", answer: "Resize signature stamps to fit initials blocks." },
      { question: "Works offline?", answer: "After the app shell loads, signing continues locally in-session." },
    ]
  ),
  "generate-qr-code": hub(
    "Free QR Code Generator — PNG & SVG Download | PDFTrusted",
    "Create QR codes online for menus, PDFs, and campaigns. High-resolution PNG/SVG export with private browser generation.",
    "free qr code generator, create qr code online, png svg qr",
    [
      "Create QR codes for restaurant menus, event check-ins, and marketing PDFs. PDFTrusted renders crisp modules with adjustable sizes and format toggles so designers can match brand guidelines.",
      "Export PNG for raster workflows or SVG for scalable print — all generated locally for a fast, free QR code maker experience.",
      SAFE,
    ],
    [
      { name: "Enter content", text: "Paste a URL or text payload." },
      { name: "Tune size", text: "Adjust slider for pixel dimensions." },
      { name: "Download", text: "Save PNG or SVG to your device." },
    ],
    [
      { question: "Is QR generation tracked?", answer: "Payloads are not sent to PDFTrusted servers during generation." },
      { question: "Can I use logos inside QR?", answer: "Use external design tools for embedded logos; this generator focuses on clean modules." },
      { question: "Error correction level?", answer: "High redundancy is enabled for better scan reliability." },
      { question: "Commercial use?", answer: "Verify licensing for your campaign; PDFTrusted does not claim trademark on outputs." },
      { question: "Dynamic QR codes?", answer: "Static codes only; use a short URL inside the payload for updatable destinations." },
    ]
  ),
  "tools/ai-scanner": hub(
    "Free Document Scanner — Deskew & Enhance Photos | PDFTrusted",
    "Turn smartphone photos into clean scans with perspective correction, sharpening, and portrait rotation. Runs entirely in your browser with OpenCV.js — no document AI services.",
    "document scanner online, photo to pdf scan, deskew receipt, browser scanner",
    [
      "PDFTrusted’s document scanner uses OpenCV.js in the browser to correct perspective, enhance contrast, and prepare print-ready PNG or PDF exports without uploading your photo to a model API.",
      "Pair results with the PDF editor or merge tool for a full offline-first workflow.",
      SAFE,
    ],
    [
      { name: "Upload photo", text: "Choose a JPG/PNG/WebP of your document." },
      { name: "Tune options", text: "Enable perspective, enhancement, and portrait rotation as needed." },
      { name: "Scan & download", text: "Process locally, preview the result, then save PNG or PDF." },
    ],
    [
      { question: "Is the scanner private?", answer: SAFE },
      { question: "Does it run on iPhone?", answer: "Yes — Safari can access the canvas pipeline; OpenCV.js may take a moment to load on first use." },
      { question: "Can it read handwriting?", answer: "This tool cleans images; it does not perform OCR transcription." },
      { question: "CamScanner comparison?", answer: "PDFTrusted emphasizes browser privacy and workflows that stay on your device for core scans." },
      { question: "Max resolution?", answer: "Large photos are downscaled for performance before enhancement." },
    ]
  ),
  "translate-pdf": hub(
    "Translate PDF Online — AI-Powered Document Translation | PDFTrusted",
    "Translate PDF documents between 30+ languages with AI. Supports English, Hindi, Spanish, French, German, Chinese, Arabic, and more. Preserves formatting and layout.",
    "translate pdf, pdf translator, hindi english pdf, pdf translation online, translate document, multilingual pdf, ai translate pdf, document translator",
    [
      "Translate any PDF document between 30+ languages using advanced AI. PDFTrusted's Translate PDF extracts text intelligently, translates it with context-aware AI models, and preserves the original document structure. Supports popular language pairs including English ↔ Hindi, English ↔ Spanish, English ↔ French, English ↔ German, English ↔ Chinese, English ↔ Arabic, and dozens more combinations.",
      "Choose your processing mode: Browser mode for quick text extraction, Cloud OCR for scanned documents, or AI Plus for full AI-powered translation with layout preservation. Small files use fast free models; larger documents leverage premium AI for accuracy and speed.",
      SAFE,
    ],
    [
      { name: "Choose Languages", text: "Select source and target languages from 30+ options (English, Hindi, Spanish, French, German, Chinese, Arabic, and more)." },
      { name: "Upload PDF", text: "Drop your document — supports text-based PDFs and scanned documents." },
      { name: "AI Translation", text: "Advanced AI translates content with context awareness, preserving meaning and formatting." },
      { name: "Download", text: "Get your translated PDF ready to share." },
    ],
    [
      { question: "What languages are supported?", answer: "30+ languages including English, Hindi, Spanish, French, German, Chinese (Simplified & Traditional), Arabic, Japanese, Korean, Portuguese, Russian, Italian, and many more." },
      { question: "Does it preserve PDF formatting?", answer: "AI Plus mode preserves document structure and layout. Browser mode extracts text only." },
      { question: "Does it work with scanned PDFs?", answer: "Yes. Use Cloud OCR mode to extract text from scanned documents, then translate." },
      { question: "How accurate is the translation?", answer: "We use advanced AI models (Gemini Flash) that understand context, technical terminology, and idiomatic expressions for high-quality translation." },
      { question: "Is there a free trial?", answer: "Yes — one AI Plus trial per account. After that, use credits for continued AI-powered translation." },
    ]
  ),
  "ai-summarize": hub(
    "AI PDF Summarizer — Summarize Any Document Instantly | PDFTrusted",
    "Upload any PDF and get an AI-generated summary in seconds. Extract key points, main ideas, and conclusions from research papers, reports, contracts, and textbooks.",
    "ai pdf summarizer, summarize pdf online, pdf summary, ai document summary, extract key points, research paper summary, report summary, executive summary",
    [
      "PDFTrusted's AI Summarizer reads your entire PDF document and produces a clear, structured summary highlighting key points, main arguments, conclusions, and important data. Perfect for quickly understanding lengthy research papers, business reports, legal contracts, academic textbooks, and meeting minutes.",
      "What is AI PDF summarization? It uses large language models to understand context across pages — not just keywords — so a hundred-page report becomes a concise brief you can act on. PDFTrusted is document-native: summaries respect page order, headings, and multi-section structure better than copy-paste into generic chatbots.",
      "Key benefits for students and professionals: save hours on literature reviews and policy PDFs; skim contracts and financial reports for clauses and risks; prepare for meetings with executive summaries; output in English, Hindi, Spanish, Arabic, or other languages even when the source document differs.",
      "How it works with privacy-first design: upload your PDF, choose summary language and AI tier, and receive a structured summary with optional follow-up chat. Cloud staging uses encrypted transfer and scheduled purge — we do not sell documents or train public models on your files. Scanned PDFs work best after OCR; iPhone photo uploads use on-device OCR before AI processing.",
      "Why choose PDFTrusted AI? One hub for 30+ PDF tools (merge, compress, translate, sign), transparent credit usage, mobile Safari download fixes, and guest-friendly access — no forced signup for browser tools. Premium unlocks larger uploads and expanded AI allowances.",
      SAFE,
    ],
    [
      { name: "Upload PDF", text: "Drop your document — research papers, reports, contracts, textbooks, or any text-based PDF." },
      { name: "Choose Language", text: "Select the language for your summary output. AI can summarize in a different language than the source." },
      { name: "AI Summarize", text: "Advanced AI reads the entire document and generates a structured summary with key points and conclusions." },
      { name: "Review & Export", text: "Read the summary, chat with follow-up questions, or download as PDF." },
    ],
    [
      { question: "How does it summarize?", answer: "Advanced AI models read and understand the entire document content, then generate a structured summary highlighting key points, arguments, conclusions, and important data." },
      { question: "Can I get a summary in a different language?", answer: "Yes. Select any output language — the AI can summarize an English document in Hindi, a French contract in English, etc." },
      { question: "Does it work with scanned PDFs?", answer: "Best with text-based PDFs. For scanned documents, run OCR first to make the text extractable." },
      { question: "Is there a free trial?", answer: "Yes — one AI Plus job per account. After that, AI credits are needed." },
      { question: "How is this different from ChatGPT?", answer: "Unlike ChatGPT, PDFTrusted's summarizer is designed specifically for PDF documents — it handles multi-page extraction, maintains document context across pages, and produces formatted summaries optimized for document review." },
    ]
  ),
  "remove-watermark": hub(
    "Spot Repair — Offline Watermark Touch-Up for PDF, JPG, PNG | PDFTrusted",
    "Soften or remove flat watermarks using browser-based repair and PDFTrusted Core reassembly. Entirely offline — no cloud AI inpainting.",
    "remove watermark locally, pdf watermark cleanup, image watermark removal browser",
    [
      "Spot repair targets simple overlays by blending nearby pixels and rebuilding PDFs from cleaned page images. It is not a generative inpainting model; complex watermarks may need manual masking.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Drop an image or PDF." },
      { name: "Choose mode", text: "Use auto or manual mask to focus on the watermark region." },
      { name: "Repair & preview", text: "Run offline repair, compare before/after for images, preview PDF output, then download." },
    ],
    [
      { question: "Does it support PDFs and images?", answer: "Yes — JPG, PNG, and PDF up to the on-page page limit." },
      { question: "Is processing secure?", answer: SAFE },
      { question: "Why is quality limited sometimes?", answer: "Without generative AI, heavily embedded or textured watermarks are harder to remove cleanly." },
      { question: "Page limits?", answer: "Large PDFs are processed page-by-page in-browser; a cap prevents browser freezes." },
      { question: "Can I use manual masking?", answer: "Yes — manual mode adjusts the region percentages before repair." },
    ]
  ),
  "hard-lock-pdf": hub(
    "Hard Lock PDF Online — Immutable Flattened PDF Free | PDFTrusted",
    "Permanently flatten text, vectors, annotations, and signatures into a high-resolution image-only PDF. Ultimate non-editable protection in your browser.",
    "hard lock pdf, flatten pdf, immutable pdf, non-editable pdf, secure pdf flatten",
    [
      "PDFTrusted Hard Lock rasterizes every page at high resolution and rebuilds a single-layer PDF. Text and signatures cannot be selected or changed in Acrobat, browsers, or editors.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Choose the final PDF you want to freeze." },
      { name: "Hard Lock", text: "Each page is flattened into a secure image layer." },
      { name: "Download", text: "Save your immutable PDF." },
    ],
    [
      {
        question: "Can Hard Lock be reversed?",
        answer: "No — flattening is permanent. Keep your original editable copy if you may need changes later.",
      },
      {
        question: "Does Hard Lock work on signed PDFs?",
        answer: "Yes — enable Hard Lock when downloading from Sign PDF or PDF Editor, or use the dedicated Hard Lock tool.",
      },
    ],
  ),
  "repair-pdf": hub(
    "Repair PDF Online — Fix Corrupted PDFs Free | PDFTrusted",
    "Repair damaged PDF files in your browser. Rebuild xref tables and download a clean PDF without uploading to a server.",
    "repair pdf, fix corrupted pdf, pdf repair tool, rebuild pdf",
    [
      "Repair PDF restores documents that fail to open, show blank pages, or throw xref errors. PDFTrusted reloads the file with encryption ignored, re-saves through PDFTrusted Private Engine, and falls back to advanced recovery when needed.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Select the broken or slow PDF." },
      { name: "Repair", text: "Processing rebuilds structure locally." },
      { name: "Download", text: "Save the repaired copy." },
    ],
    [{ question: "Will repair recover all content?", answer: "Severely damaged files may lose pages or images; try the output in your reader before discarding originals." }],
  ),
  "redact-pdf": hub(
    "Redact PDF Online — Remove Sensitive Text Free | PDFTrusted",
    "Redact emails, credit cards, and phone numbers from PDFs with black boxes. Pattern-based redaction in your browser.",
    "redact pdf, pdf redaction, remove sensitive data pdf",
    [
      "Batch redaction finds pattern matches in PDF text layers and draws solid black rectangles over them before export.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Add the PDF to sanitize." },
      { name: "Choose patterns", text: "Enable email, card, phone, or custom regex." },
      { name: "Download", text: "Get the redacted PDF." },
    ],
    [{ question: "Is redaction permanent?", answer: "Yes — covered text is replaced with black boxes in a new PDF. Always verify the output." }],
  ),
  "ocr-pdf": hub(
    "OCR PDF Online — Searchable PDF & Text Export | PDFTrusted",
    "Run OCR via secure cloud workers (Tesseract-based pipeline). Create searchable PDFs or download plain text from scans.",
    "ocr pdf, searchable pdf, tesseract pdf, scan to text",
    [
      "OCR adds a searchable text layer to scanned PDFs. Cloud processing is used for this tool; results depend on scan quality and language.",
      `${OCR_ACCURACY_NOTE} ${SAFE}`,
    ],
    [
      { name: "Upload scan", text: "Add a scanned or image PDF." },
      { name: "Pick output", text: "Searchable PDF or .txt." },
      { name: "Download", text: "Save OCR results." },
    ],
    [
      { question: "How accurate is OCR?", answer: OCR_ACCURACY_NOTE },
      {
        question: "Are my files stored?",
        answer: "Cloud OCR uses temporary staging that is removed automatically. Download your result promptly.",
      },
    ],
  ),
  "pdf-to-html": hub(
    "PDF to HTML — Export PDF as Web Page | PDFTrusted",
    "Convert PDF text to a clean HTML document for blogs, archives, and quick publishing.",
    "pdf to html, export pdf html, pdf web page",
    [
      "PDF to HTML extracts text per page into semantic sections with lightweight styling.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Choose your PDF." },
      { name: "Convert", text: "Text is extracted locally." },
      { name: "Download", text: "Open the .html file anywhere." },
    ],
    [{ question: "Are images included?", answer: "This export focuses on text; image-heavy layouts may need the PDF to Image tool." }],
  ),
  "document-scanner": hub(
    "Document Scanner — Photo to PDF Online | PDFTrusted",
    "Crop, rotate, and apply a B&W scan filter to photos of documents. Export a PDF in your browser — zero uploads, built for students.",
    "document scanner online, photo to pdf, scan document browser, student scanner",
    [
      "Document Scanner turns phone photos into clean, printable PDFs without sending files to a server. Crop edges, rotate orientation, and apply a high-contrast scan filter before download.",
      "Student Essentials tools run entirely in your browser with PDFTrusted Private Engine — ideal for assignments, receipts, and ID copies on shared campus Wi‑Fi.",
      SAFE,
    ],
    [
      { name: "Upload photo", text: "Drop a JPG or PNG of your document." },
      { name: "Enhance", text: "Crop, rotate, and toggle the B&W scan filter." },
      { name: "Export PDF", text: "Download a PDF assembled locally." },
    ],
    [
      { question: "Are my scans uploaded?", answer: "No — processing stays on your device." },
      { question: "What formats are supported?", answer: "JPG and PNG inputs; PDF output." },
    ],
  ),
  "photo-resizer": hub(
    "Photo Resizer for Forms — Exact KB Size | PDFTrusted",
    "Resize passport and application photos to an exact file size in KB. Private browser processing for university and visa portals.",
    "photo resizer kb, compress photo to kb, passport photo size, student forms",
    [
      "Photo Resizer compresses images to the exact kilobyte limit required by online application portals — common targets include 20, 50, 100, and 200 KB.",
      "Everything runs locally so your face photo never transits through PDFTrusted servers.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Choose your profile or passport photo." },
      { name: "Set KB target", text: "Pick the size required by your form." },
      { name: "Download", text: "Save the resized image instantly." },
    ],
    [
      { question: "Will quality suffer?", answer: "We balance quality and size iteratively until the target KB is met." },
      { question: "Do I need an account?", answer: "No — the tool is free and works without sign-in." },
    ],
  ),
  "resume-builder": hub(
    "Professional CV & Resume Builder — Premium Templates | PDFTrusted",
    "Create recruiter-ready resumes with corporate, government, creative, and international templates. Live preview, section editor, and private PDF export.",
    "resume builder, cv maker, professional resume, ats resume, government resume, free cv pdf",
    [
      "PDFTrusted Resume Studio helps students, freshers, and professionals build polished CVs in minutes with premium templates and real-time preview.",
      "Drag-and-drop sections, optional photo crop, accent colors, and print-ready PDF export — all processed locally in your browser.",
      SAFE,
    ],
    [
      { name: "Choose template", text: "Browse categorized premium layouts with live thumbnails." },
      { name: "Edit sections", text: "Fill experience, education, skills, and more with guided section navigation." },
      { name: "Download PDF", text: "Export a print-ready resume that matches your preview." },
    ],
    [
      { question: "Is my resume stored on your servers?", answer: "No — drafts save to localStorage on your device only." },
      { question: "Are templates ATS-friendly?", answer: "Many layouts use clear headings and single-column structure optimized for applicant tracking systems." },
    ],
  ),
  "professional-cv-maker": hub(
    "Professional CV Maker — Free Online Resume Builder | PDFTrusted",
    "Build a professional CV with premium templates, live preview, and instant PDF download — private and free.",
    "professional cv maker, cv builder, resume creator, free cv",
    [
      "Create a corporate-ready CV with executive and professional templates designed for recruiters.",
      SAFE,
    ],
    [
      { name: "Pick a template", text: "Choose a corporate or executive layout." },
      { name: "Complete sections", text: "Add your experience and skills with live preview." },
      { name: "Export", text: "Download your CV as PDF." },
    ],
    [{ question: "Is it free?", answer: "Yes — the resume builder is free with no account required." }],
  ),
  "government-resume-builder": hub(
    "Government Resume Builder — Formal CV Templates | PDFTrusted",
    "Create formal government-style resumes with official formatting and optional photo support.",
    "government resume builder, formal cv, public sector resume",
    [
      "Government-formal templates follow structured layouts suitable for public sector and official applications.",
      SAFE,
    ],
    [
      { name: "Select formal template", text: "Choose the government-formal layout." },
      { name: "Enter details", text: "Complete all required sections." },
      { name: "Download PDF", text: "Export your formal resume." },
    ],
    [{ question: "Can I add a photo?", answer: "Yes — photo is optional and templates adapt when omitted." }],
  ),
  "ats-friendly-resume-builder": hub(
    "ATS-Friendly Resume Builder — Scanner-Optimized CV | PDFTrusted",
    "Build resumes optimized for applicant tracking systems with clean single-column layouts.",
    "ats resume builder, ats friendly cv, applicant tracking resume",
    [
      "ATS-friendly templates use clear headings, standard fonts, and readable structure for automated screening.",
      SAFE,
    ],
    [
      { name: "Choose ATS template", text: "Pick ATS-friendly or US international layout." },
      { name: "Fill content", text: "Add keywords-rich experience and skills." },
      { name: "Export PDF", text: "Download your ATS-ready resume." },
    ],
    [{ question: "What makes a resume ATS-friendly?", answer: "Simple layout, standard section titles, and no complex graphics in the body text." }],
  ),
  "protect-pdf": hub(
    "Protect PDF Online — Add Password Security | PDFTrusted",
    "Password-protect PDF files in your browser. Set open permissions and restrict printing or copying with secure local processing.",
    "protect pdf, password protect pdf, secure pdf, encrypt pdf online",
    [
      "Add a password to sensitive PDFs before sharing contracts, tax forms, or client deliverables. PDFTrusted applies protection using standard PDF security handlers while keeping files on your device when possible.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Select the PDF to protect." },
      { name: "Set password", text: "Choose a strong password and permissions." },
      { name: "Download", text: "Save the secured PDF." },
    ],
    [{ question: "Is password protection reversible?", answer: "Only with the correct password or our unlock tool if permitted." }],
  ),
  "universal-converter": hub(
    "Universal File Converter — PDF & Office Formats | PDFTrusted",
    "Convert between PDF, images, and office formats in one workflow with privacy-first browser processing.",
    "pdf converter, universal converter, convert pdf online",
    [
      "Universal Converter routes your files through the right PDFTrusted pipeline—compression, rasterization, or document export—without leaving the site.",
      SAFE,
    ],
    [
      { name: "Choose format", text: "Pick input and output types." },
      { name: "Upload", text: "Add your source file." },
      { name: "Convert", text: "Download the converted result." },
    ],
    [{ question: "Are conversions stored on servers?", answer: SAFE }],
  ),
  "jpg-to-pdf": hub(
    "JPG to PDF — Convert Images to PDF Online | PDFTrusted",
    "Turn JPG photos into a single PDF in your browser. Fast, free, and private — no account required.",
    "jpg to pdf, image to pdf, convert jpg online",
    [
      "Combine one or more JPG images into a polished PDF for email, printing, or archiving. Processing stays in your browser whenever possible.",
      SAFE,
    ],
    [
      { name: "Upload JPGs", text: "Select image files from your device." },
      { name: "Arrange", text: "Order pages if you uploaded multiple images." },
      { name: "Download PDF", text: "Export and save the PDF locally." },
    ],
    [{ question: "Is JPG to PDF private?", answer: SAFE }],
  ),
  "png-to-pdf": hub(
    "PNG to PDF — Convert PNG to PDF Online | PDFTrusted",
    "Convert PNG images with transparency into a shareable PDF. Browser-based and free.",
    "png to pdf, convert png online",
    [
      "PNG to PDF is ideal for screenshots, diagrams, and graphics that need crisp edges in a document bundle.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Add your PNG file(s)." },
      { name: "Convert", text: "Build the PDF in your browser." },
      { name: "Download", text: "Save the finished PDF." },
    ],
    [{ question: "Does transparency stay sharp?", answer: "We rasterize pages at high resolution so edges remain clean in the exported PDF." }],
  ),
  "excel-to-pdf": hub(
    "Excel to PDF — Convert Spreadsheets Online | PDFTrusted",
    "Convert Excel workbooks to PDF for sharing and printing. Secure cloud conversion when enabled.",
    "excel to pdf, xlsx to pdf, spreadsheet to pdf",
    [
      "Excel to PDF helps you distribute tables and reports as fixed-layout documents colleagues can open anywhere.",
      SAFE,
    ],
    [
      { name: "Upload spreadsheet", text: "Select .xlsx or .xls file." },
      { name: "Convert", text: "Run the cloud or browser pipeline." },
      { name: "Download", text: "Save the PDF output." },
    ],
    [{ question: "Will formulas remain editable?", answer: "PDF is a view-only format; keep your original Excel file for edits." }],
  ),
  "pdf-to-excel": hub(
    "PDF to Excel — Extract Tables to XLSX | PDFTrusted",
    "Pull tables and rows from PDFs into Excel spreadsheets with smart cloud extraction.",
    "pdf to excel, pdf table to xlsx",
    [
      "PDF to Excel detects grid structures and exports sheets you can filter and calculate in Excel.",
      SAFE,
    ],
    [
      { name: "Upload PDF", text: "Choose a PDF with tables or text." },
      { name: "Extract", text: "Cloud engine maps tables to sheets." },
      { name: "Download XLSX", text: "Open the workbook in Excel or Google Sheets." },
    ],
    [{ question: "Does it work on scans?", answer: "Run OCR PDF first for scanned documents, then convert again for best results." }],
  ),
  "pdf-to-pptx": hub(
    "PDF to PowerPoint — Convert PDF to PPTX | PDFTrusted",
    "Turn PDF slides and pages into an editable PowerPoint deck with secure cloud conversion.",
    "pdf to pptx, pdf to powerpoint",
    [
      "PDF to PPTX helps presenters recover editable slides from PDF handouts and reports.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Select your PDF." },
      { name: "Convert", text: "Cloud worker builds a PPTX file." },
      { name: "Download", text: "Open in PowerPoint or Google Slides." },
    ],
    [{ question: "Is layout preserved?", answer: "Complex designs may need minor tweaks after conversion; simple slide PDFs convert best." }],
  ),
  "chat-pdf": hub(
    "Chat with PDF — AI-Powered Document Q&A | PDFTrusted",
    "Ask questions about any PDF and get instant, citation-backed AI answers. Understand contracts, research papers, legal documents, and reports in seconds — no reading required.",
    "chat with pdf, pdf ai, ask pdf questions, pdf q&a, pdf chatbot, document ai, ai pdf reader, pdf assistant, talk to pdf",
    [
      "Chat with your PDF using advanced AI that reads and understands your entire document. Unlike generic chatbots, PDFTrusted's Chat PDF grounds every answer in the actual document content — with context-aware responses that reference specific sections. Ask follow-up questions, request summaries of specific pages, or get explanations of complex legal and technical language.",
      "Ideal for students reviewing textbooks, lawyers analyzing contracts, researchers parsing papers, and professionals reviewing lengthy reports. Supports multi-page documents with intelligent chunking for accurate answers across 100+ page PDFs.",
      SAFE,
    ],
    [
      { name: "Upload PDF", text: "Drop your PDF document — contracts, research papers, textbooks, reports, or any text-based PDF." },
      { name: "AI Analysis", text: "AI reads, indexes, and understands the full document structure, extracting key information from every page." },
      { name: "Chat", text: "Ask anything in natural language — get accurate, citation-backed answers grounded in your document content." },
    ],
    [
      { question: "Does it hallucinate answers?", answer: "No. Answers are grounded in the document content only. If the answer isn't in the PDF, the AI tells you rather than making something up. Every response is traceable to specific document sections." },
      { question: "How large can my PDF be?", answer: "Free users can chat with up to 2-page PDFs. Premium users get up to 10 pages with advanced AI models for deeper analysis." },
      { question: "Is my document private?", answer: "Yes. Documents are processed securely and never stored permanently. Your data is deleted after processing." },
      { question: "What languages are supported?", answer: "Chat PDF works with documents in English, Hindi, Spanish, French, German, Chinese, Arabic, and 50+ other languages." },
      { question: "How is this different from iLovePDF or SmallPDF?", answer: "Neither iLovePDF nor SmallPDF offer AI-powered document chat. PDFTrusted is one of the few platforms that lets you have a conversation with your PDF, not just process it." },
    ],
  ),
  "smart-scan-ai": hub(
    "Smart Scan AI — Document Reconstruction from Photos & Scans | PDFTrusted",
    "Upload any photo, scan, screenshot, or handwritten note and AI rebuilds it into a clean, structured, searchable, editable PDF. Beyond OCR — full document reconstruction.",
    "smart scan ai, image to pdf, scan to editable pdf, document reconstruction, photo to pdf, handwriting to text, ai document scanner, ocr alternative, scan to text",
    [
      "Smart Scan AI reconstructs document structure—not just plain OCR text. Multi-pass vision AI aims to detect headings, paragraphs, tables, forms, signatures, logos, and layout, then rebuild a searchable, editable PDF.",
      "Works with photos, scans, screenshots, and PDF inputs. Results depend on image quality, lighting, and language; always review output before official use.",
      SAFE,
    ],
    [
      { name: "Upload", text: "Drop any photo, scan, screenshot, fax, or PDF — JPG, PNG, WEBP, and PDF formats supported." },
      { name: "AI Vision Analysis", text: "Multi-pass vision AI detects text, layout, tables, forms, and structure—accuracy varies with scan quality." },
      { name: "Reconstruct", text: "Get a clean, searchable, professional PDF that preserves the original document's structure and formatting." },
    ],
    [
      { question: "What file types are supported?", answer: "JPG, PNG, WEBP, PDF scans, screenshots, fax images, and photos of documents — any image format." },
      { question: "Does it work with handwriting?", answer: "Yes. AI reads handwritten notes, forms, and signatures and converts them to typed, editable text while preserving layout." },
      { question: "How is this different from OCR?", answer: "OCR extracts text only and loses all formatting. Smart Scan AI understands the entire document structure — headings, tables, forms, columns, layout, images — and rebuilds a pixel-perfect professional document. It's OCR + layout intelligence + formatting reconstruction combined." },
      { question: "Can it handle blurry or tilted photos?", answer: "Yes. The multi-pass AI is trained on millions of document images and handles low quality, tilted, blurry, and partially obscured inputs." },
      { question: "Does iLovePDF or SmallPDF have this?", answer: "No. Neither platform offers AI document reconstruction. They provide basic OCR that only extracts text without preserving document structure. Smart Scan AI is unique to PDFTrusted." },
    ],
  ),
  "ai-document-scanner": hub(
    "AI Document Scanner — Scan Photos to Editable PDF | PDFTrusted",
    "Free AI document scanner online. Turn phone photos, scans, and screenshots into clean, searchable, editable PDFs with layout preserved. Chat to edit after scan.",
    "ai document scanner, document scanner ai, scan document online, ai scanner pdf, photo document scanner, intelligent document scanner, scan to editable pdf",
    [
      "PDFTrusted's AI document scanner goes beyond basic OCR. Upload a photo of any document — invoice, contract, ID, handwritten note — and vision AI rebuilds structure, tables, headings, and text into a professional editable PDF.",
      "Use the built-in AI chat to add logos, fix text, translate, or apply edits — then download PDF or export Word directly from the workspace.",
      SAFE,
    ],
    [
      { name: "Scan or upload", text: "Use your phone camera photo, flatbed scan, or PDF — JPG, PNG, WEBP supported." },
      { name: "AI reads layout", text: "Vision AI detects columns, tables, handwriting, and document type." },
      { name: "Editable output", text: "Download searchable PDF, export Word, or chat to revise." },
    ],
    [
      { question: "Is this an AI document scanner or OCR?", answer: "Both — but smarter. OCR extracts text only. Our AI document scanner reconstructs the full document layout into an editable PDF." },
      { question: "Can I edit after scanning?", answer: "Yes. Chat with AI to apply changes (signature line, translation, logo) and regenerate your PDF instantly." },
      { question: "Does it work on mobile?", answer: "Yes. Take a photo on your phone, upload, and reconstruct — no app install required." },
    ],
  ),
  "photo-to-editable-pdf": hub(
    "Photo to Editable PDF — Convert Document Photos Online | PDFTrusted",
    "Convert document photos to editable PDF free. AI reconstructs text, tables, and layout from JPG/PNG photos — not a flat image embed. Download PDF or Word.",
    "photo to editable pdf, picture to editable pdf, convert photo to pdf editable, image to editable pdf, photo to word pdf, scan photo to pdf editable",
    [
      "Stop embedding blurry photos inside PDFs. PDFTrusted Smart Scan AI converts your document photo into a true editable PDF with selectable text, rebuilt tables, and clean formatting.",
      "Perfect for WhatsApp document photos, camera snapshots, and screenshots. Premium users process up to 5 pages per job; free users get 2 pages.",
      SAFE,
    ],
    [
      { name: "Upload photo", text: "JPG, PNG, or WEBP — even tilted or low-light shots." },
      { name: "AI reconstruction", text: "Vision AI rebuilds document structure, not just OCR text." },
      { name: "Edit & export", text: "Chat to edit, download PDF, or export Word from the workspace." },
    ],
    [
      { question: "Photo to PDF vs photo to editable PDF?", answer: "Basic converters wrap your image in a PDF page. We rebuild a real document with text, headings, and tables you can edit and search." },
      { question: "Can I add my logo after conversion?", answer: "Yes — attach your logo in AI chat and describe placement (e.g. top right). Click Apply to regenerate." },
      { question: "Export to Word?", answer: "Yes. Use Export Word in the workspace after reconstruction — one click, no extra tool." },
    ],
  ),
  "scan-to-editable-pdf": hub(
    "Scan to Editable PDF — AI Reconstruction from Scans | PDFTrusted",
    "Turn scanned PDFs and document scans into fully editable, searchable PDFs. AI preserves layout, tables, and handwriting. Free online tool.",
    "scan to editable pdf, scanned pdf to editable, make scanned pdf editable, scan to word, ai scan reconstruction",
    [
      "Scanned PDFs are often flat images. Smart Scan AI analyzes each page with vision models and reconstructs a clean document you can edit, search, and export.",
      "Multi-page support: free accounts process 2 pages; Premium reconstructs up to 5 pages per scan with higher accuracy passes.",
      SAFE,
    ],
    [
      { name: "Upload scan", text: "PDF scan or image — multi-page PDFs supported within plan limits." },
      { name: "Per-page AI", text: "Each page is analyzed separately for accurate multi-page output." },
      { name: "Download & edit", text: "Get editable PDF, chat revisions, or Word export." },
    ],
    [
      { question: "How many pages can I scan?", answer: "Free: 2 pages per job. Premium: up to 5 pages with enhanced vision passes." },
      { question: "Better than OCR PDF tool?", answer: "OCR adds a text layer to image scans. Smart Scan rebuilds document structure — better for forms, invoices, and mixed layouts." },
    ],
  ),
  "image-to-editable-pdf": hub(
    "Image to Editable PDF — JPG/PNG to Structured Document | PDFTrusted",
    "Convert JPG, PNG, or WEBP images to editable PDF with AI layout reconstruction. Tables, headings, and handwriting preserved.",
    "image to editable pdf, jpg to editable pdf, png to editable pdf, image to structured pdf, convert image to document pdf",
    [
      "Convert any document image into a structured editable PDF. Smart Scan AI detects document type, language, and layout — then outputs a professional file ready for download or Word export.",
      SAFE,
    ],
    [
      { name: "Drop image", text: "JPG, PNG, WEBP — photos, scans, screenshots." },
      { name: "AI rebuild", text: "Full structure reconstruction with Vision AI." },
      { name: "Export", text: "PDF download, Word export, or AI chat edits." },
    ],
    [
      { question: "JPG to PDF vs JPG to editable PDF?", answer: "JPG-to-PDF tools paste the image on a page. We extract and rebuild the document content as real text and layout." },
    ],
  ),
  "pdf-to-pdfa": hub(
    "PDF to PDF/A Converter — ISO 19005 Compliant Archival | PDFTrusted",
    "Convert any PDF to PDF/A-1b, PDF/A-2b, or PDF/A-3b for government compliance, legal archival, EU e-invoicing, and long-term document preservation. Free browser-based tool.",
    "pdf to pdfa, pdf archival, iso 19005, pdf/a converter, pdf/a-1b, pdf/a-2b, pdf/a-3b, government pdf, legal archival, zugferd, factur-x",
    [
      "PDF/A (ISO 19005) is the international standard for long-term document archival. Courts, government agencies, tax authorities, and archives worldwide require PDF/A format for official submissions. PDFTrusted's converter supports all three major conformance levels: PDF/A-1b (most compatible, accepted by virtually all agencies), PDF/A-2b (modern with JPEG2000 and transparency support), and PDF/A-3b (latest standard with embedded file support for ZUGFeRD/Factur-X e-invoicing).",
      "The conversion embeds all fonts, standardizes XMP metadata, adds sRGB ICC color profiles, and creates output intent declarations — all required by the ISO standard. Processing happens entirely in your browser using pdf-lib, so your documents never leave your device.",
      SAFE,
    ],
    [
      { name: "Upload PDF", text: "Select your PDF document — any standard PDF file." },
      { name: "Choose Conformance Level", text: "Pick PDF/A-1b (government/legal), PDF/A-2b (modern archival), or PDF/A-3b (e-invoicing with attachments)." },
      { name: "Set Metadata", text: "Optionally set document title, author, and subject for proper archival metadata." },
      { name: "Convert & Download", text: "Get your ISO 19005 compliant PDF/A file with embedded fonts, ICC profiles, and XMP metadata." },
    ],
    [
      { question: "What is PDF/A?", answer: "PDF/A is an ISO standard (19005) for long-term archival. It embeds all fonts, standardizes metadata, removes external dependencies (like linked images), and ensures the document will render identically decades from now." },
      { question: "Which conformance level should I use?", answer: "PDF/A-1b is the most widely accepted — use for government submissions, court filings, and tax documents. PDF/A-2b adds modern features like JPEG2000 compression and transparency. PDF/A-3b supports embedded file attachments, required for ZUGFeRD and Factur-X e-invoicing." },
      { question: "Is PDF/A required for government submissions?", answer: "Yes, in many jurisdictions. EU courts, US federal agencies, German tax authorities, and many regulatory bodies require or prefer PDF/A for official document submissions." },
      { question: "Is this processed in my browser?", answer: "Yes. The entire conversion happens locally in your browser using pdf-lib. Your document never leaves your device." },
      { question: "Do iLovePDF or SmallPDF offer PDF/A conversion?", answer: "iLovePDF offers limited PDF/A conversion. PDFTrusted provides all three conformance levels (1b, 2b, 3b) with full metadata control, ICC color profile embedding, and 100% browser-based privacy." },
    ],
  ),
  "flatten-pdf": hub(
    "Flatten PDF Online — Remove Form Fields & Annotations | PDFTrusted",
    "Flatten PDF forms, annotations, and interactive elements into static, non-editable content. Finalize contracts, applications, and government forms before sharing. Free browser tool.",
    "flatten pdf, remove form fields, pdf flatten online, make pdf read only, finalize pdf, pdf annotations, static pdf, lock form fields, flatten acroforms",
    [
      "Flatten PDF converts all interactive form fields — text boxes, checkboxes, radio buttons, dropdowns, digital signatures, and annotations (comments, stamps, highlights, sticky notes) — into permanent, static, non-editable content embedded directly in the PDF pages. This is essential for finalizing contracts, completed applications, tax forms, and official documents before sharing or archival.",
      "Processing happens 100% in your browser using pdf-lib. Your document never leaves your device — no uploads, no servers, complete privacy. Works with AcroForm fields, XFA forms, and all standard PDF annotation types.",
      SAFE,
    ],
    [
      { name: "Upload PDF", text: "Drop your PDF with form fields, annotations, or interactive elements." },
      { name: "Flatten", text: "All interactive elements — form fields, checkboxes, annotations, stamps — become static, permanent, non-editable content." },
      { name: "Download", text: "Save the flattened PDF ready for sharing, printing, or archival." },
    ],
    [
      { question: "What does flattening a PDF do?", answer: "Flattening converts interactive form fields (text boxes, checkboxes, dropdowns, signatures) and annotations (comments, stamps, highlights) into static, non-editable content permanently embedded in the page. The visual appearance is preserved, but users can no longer edit the fields." },
      { question: "Is this processed in my browser?", answer: "Yes. Your PDF never leaves your device. All flattening happens 100% locally in your browser using pdf-lib. No uploads, no cloud processing." },
      { question: "Will flattening remove my form data?", answer: "No. All filled-in values are preserved exactly as they appear — they just become permanent, uneditable static text." },
      { question: "Can I undo flattening?", answer: "No. Flattening is irreversible. Always keep a backup of the original if you might need the interactive version later." },
      { question: "Why flatten a PDF?", answer: "Common reasons: finalizing signed contracts, submitting completed government forms, archiving filled applications, preventing form tampering, and ensuring consistent rendering across all PDF viewers." },
    ],
  ),
  "compare-pdf": hub(
    "Compare PDF Online — Side-by-Side Text Diff Tool | PDFTrusted",
    "Compare two PDF documents side by side with word-level diff highlighting. See every addition, deletion, and change instantly. Perfect for contracts, legal revisions, and version tracking. Free browser tool.",
    "compare pdf, pdf diff, pdf comparison, compare two pdfs, document comparison, contract diff, revision tracking, pdf version compare, legal document diff, side by side pdf",
    [
      "Upload two PDF files and instantly see every text difference highlighted — additions in green, deletions in red, with a precise similarity score. PDFTrusted's Compare PDF uses a Myers-algorithm word-level diff engine that catches even single-word changes across hundreds of pages. Perfect for reviewing contract revisions, comparing legal draft versions, auditing report changes, and tracking document edits.",
      "The entire comparison runs 100% in your browser — both PDFs are processed locally using pdfjs-dist for text extraction, and no data is ever uploaded to any server. Side-by-side view shows the original and revised document with inline highlights for maximum clarity.",
      SAFE,
    ],
    [
      { name: "Upload Two PDFs", text: "Drop the original (A) and revised (B) versions of your document." },
      { name: "Compare", text: "Word-level diff engine extracts text from both PDFs and identifies every addition, deletion, and modification." },
      { name: "Review Results", text: "See additions (green), deletions (red), and an overall similarity percentage in a side-by-side view." },
    ],
    [
      { question: "How does PDF comparison work?", answer: "We extract text from both PDFs using pdfjs-dist and run a Myers-algorithm word-level diff. Changes are highlighted in green (additions) and red (deletions) with a similarity percentage score." },
      { question: "Does it work with scanned PDFs?", answer: "It works best with text-based PDFs. For scanned documents, run our OCR tool first to make the text extractable, then compare." },
      { question: "Is my document private?", answer: "Yes. Both PDFs are processed 100% in your browser. No data is uploaded to any server." },
      { question: "Can I compare more than 2 files?", answer: "Currently the tool compares two PDFs at a time. For multiple versions, compare them in pairs." },
      { question: "Do iLovePDF or SmallPDF offer PDF comparison?", answer: "Neither iLovePDF nor SmallPDF offer word-level PDF text diff comparison. PDFTrusted's Compare PDF with side-by-side highlighting is a unique advanced feature." },
    ],
  ),
  "ai-question-gen": hub(
    "AI Question Generator — Generate MCQs, Quizzes from PDF | PDFTrusted",
    "Upload any PDF and AI generates multiple-choice questions, true/false, short answer, and fill-in-the-blank questions with answers and explanations. Perfect for teachers, students, tutors, and exam preparation.",
    "ai question generator, pdf quiz maker, generate questions from pdf, mcq generator, exam preparation, ai quiz, test generator, study tool, flashcard maker, auto quiz",
    [
      "AI Question Generator is the smartest way to create study materials from any PDF. Upload a textbook chapter, lecture notes, research paper, or study guide, and advanced AI reads the content and generates high-quality educational questions automatically — Multiple Choice (MCQ), True/False, Short Answer, and Fill-in-the-Blank — complete with correct answers and detailed explanations.",
      "Customize your quiz with precision: choose 5 to 20 questions, select one or more question types, and set Easy, Medium, or Hard difficulty levels to match your audience. Perfect for teachers creating exam papers, students preparing for tests, tutors building practice quizzes, and corporate trainers developing assessment materials. Export results by copying to clipboard or downloading as a text file.",
      "No other online PDF tool offers AI-powered question generation. iLovePDF, SmallPDF, and Adobe Acrobat don't have this capability — it's a PDFTrusted exclusive that transforms passive reading into active learning.",
      SAFE,
    ],
    [
      { name: "Upload PDF", text: "Drop your study material, textbook chapter, lecture notes, or any text-based PDF document." },
      { name: "Configure", text: "Choose question types (MCQ, True/False, Short Answer, Fill-in-the-Blank), count (5-20), and difficulty level (Easy, Medium, Hard)." },
      { name: "Generate", text: "AI reads your document and creates high-quality questions with correct answers and detailed explanations." },
      { name: "Export", text: "Copy all questions to clipboard or download as a formatted text file for easy sharing." },
    ],
    [
      { question: "What types of questions can it generate?", answer: "Four types: Multiple Choice (MCQ) with 4 options, True/False, Short Answer, and Fill-in-the-Blank — all with correct answers and detailed explanations." },
      { question: "How accurate are the questions?", answer: "AI generates questions directly from your document content, ensuring high relevance and factual accuracy. Every question is grounded in the actual text. We recommend reviewing for your specific exam context." },
      { question: "Can I control difficulty?", answer: "Yes. Choose Easy (recall and basic comprehension), Medium (application and analysis), or Hard (synthesis and evaluation) to match your audience level." },
      { question: "Who is this for?", answer: "Teachers creating exam papers, students preparing for tests, tutors building practice quizzes, corporate trainers developing assessments, and anyone who wants to test their understanding of a document." },
      { question: "Does it use AI credits?", answer: "Yes. Like other AI tools, it uses credits based on document length and question count. Premium users get priority AI processing." },
      { question: "Does iLovePDF or SmallPDF have this?", answer: "No. AI Question Generator is a PDFTrusted exclusive. No other major PDF platform offers AI-powered quiz generation from documents." },
    ],
  ),
  "pdf-to-epub": hub(
    "PDF to EPUB — Ebook Conversion Online | PDFTrusted",
    "Convert PDF documents into EPUB ebooks for Kindle and e-readers.",
    "pdf to epub, ebook converter",
    [
      "PDF to EPUB reflows text for smaller screens so readers can adjust font size comfortably.",
      SAFE,
    ],
    [
      { name: "Upload PDF", text: "Choose a text-based PDF." },
      { name: "Convert", text: "Generate EPUB in the cloud." },
      { name: "Download", text: "Send to your e-reader app." },
    ],
    [{ question: "Do scanned PDFs work?", answer: "OCR the PDF first if it is a scan so text can reflow properly." }],
  ),
};

const TOOL_SEO_ALIASES: Record<string, string> = {
  "pdf-to-png": "pdf-to-image",
  "pdf-to-jpg": "pdf-to-image",
  "magic-eraser": "remove-watermark",
};

export function getToolSeoBundle(slug: string): ToolRichSeo | undefined {
  const key = TOOL_SEO_ALIASES[slug] ?? slug;
  return TOOL_SEO_BUNDLES[key];
}

export function getGenericKnowledgeCopy(toolName: string): { bodyParagraphs: string[]; faqs: ToolFaq[] } {
  return {
    bodyParagraphs: [
      `${toolName} on PDFTrusted runs in your browser when possible. Upload, process, and download without installing desktop software.`,
      SAFE,
    ],
    faqs: [
      { question: "Is it safe to process PDFs with PDFTrusted?", answer: SAFE },
      { question: "Do I need an account?", answer: "Most core tools work without sign-up; premium limits may apply for heavy usage." },
      { question: "Which browsers are supported?", answer: "Latest Chrome, Edge, Firefox, and Safari generally work best." },
      { question: "Can I use PDFTrusted commercially?", answer: "Yes for many workflows; review terms for redistribution and compliance needs." },
      { question: "How do I get help?", answer: "Use the contact page or report issue dialog from any tool." },
    ],
  };
}
