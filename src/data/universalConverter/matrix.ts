export type FormatId =
  | "pdf"
  | "docx"
  | "doc"
  | "xlsx"
  | "xls"
  | "webp"
  | "heic"
  | "heif"
  | "jpg"
  | "jpeg"
  | "png"
  | "gif"
  | "bmp"
  | "txt"
  | "rtf"
  | "epub";

export type TargetId = FormatId | "html" | "zip";

export type TargetOption = {
  id: TargetId;
  label: string;
  icon: string;
  /** Dedicated tool slug when one exists */
  toolSlug?: string;
};

const EXT_MAP: Record<string, FormatId> = {
  pdf: "pdf",
  docx: "docx",
  doc: "doc",
  xlsx: "xlsx",
  xls: "xls",
  webp: "webp",
  heic: "heic",
  heif: "heif",
  jpg: "jpg",
  jpeg: "jpeg",
  png: "png",
  gif: "gif",
  bmp: "bmp",
  txt: "txt",
  rtf: "rtf",
  epub: "epub",
};

const MIME_MAP: Record<string, FormatId> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "text/plain": "txt",
  "application/rtf": "rtf",
  "application/epub+zip": "epub",
};

export function detectFormat(file: File): FormatId {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext && EXT_MAP[ext]) return EXT_MAP[ext]!;
  const mime = (file.type || "").toLowerCase();
  if (mime && MIME_MAP[mime]) return MIME_MAP[mime]!;
  if (mime.startsWith("image/")) return "jpg";
  return "pdf";
}

export function formatLabel(id: FormatId | TargetId): string {
  const labels: Record<string, string> = {
    pdf: "PDF",
    docx: "Word",
    doc: "Word",
    xlsx: "Excel",
    xls: "Excel",
    webp: "WebP",
    heic: "HEIC",
    heif: "HEIF",
    jpg: "JPG",
    jpeg: "JPG",
    png: "PNG",
    gif: "GIF",
    bmp: "BMP",
    txt: "TXT",
    rtf: "RTF",
    epub: "EPUB",
    html: "HTML",
    zip: "ZIP",
  };
  return labels[id] ?? id.toUpperCase();
}

function imageTargets(includePdf = true): TargetOption[] {
  const base: TargetOption[] = [
    { id: "jpg", label: "JPG", icon: "🖼️", toolSlug: "pdf-to-jpg" },
    { id: "png", label: "PNG", icon: "🖼️", toolSlug: "pdf-to-png" },
    { id: "webp", label: "WebP", icon: "🖼️" },
  ];
  if (includePdf) {
    base.push({ id: "pdf", label: "PDF", icon: "📄", toolSlug: "jpg-to-pdf" });
  }
  return base;
}

export function getTargetsForFormat(from: FormatId): TargetOption[] {
  switch (from) {
    case "pdf":
      return [
        { id: "docx", label: "Word", icon: "📝", toolSlug: "pdf-to-word" },
        { id: "jpg", label: "JPG", icon: "🖼️", toolSlug: "pdf-to-jpg" },
        { id: "png", label: "PNG", icon: "🖼️", toolSlug: "pdf-to-png" },
        { id: "html", label: "HTML", icon: "🌐", toolSlug: "pdf-to-html" },
        { id: "txt", label: "TXT", icon: "📃" },
        { id: "epub", label: "EPUB", icon: "📚", toolSlug: "pdf-to-epub" },
        { id: "xlsx", label: "Excel", icon: "📊", toolSlug: "pdf-to-excel" },
      ];
    case "heic":
    case "heif":
      return [
        { id: "jpg", label: "JPG", icon: "🖼️" },
        { id: "png", label: "PNG", icon: "🖼️" },
        { id: "pdf", label: "PDF", icon: "📄" },
      ];
    case "webp":
      return imageTargets(true);
    case "jpg":
    case "jpeg":
      return [
        { id: "png", label: "PNG", icon: "🖼️" },
        { id: "webp", label: "WebP", icon: "🖼️" },
        { id: "pdf", label: "PDF", icon: "📄", toolSlug: "jpg-to-pdf" },
      ];
    case "png":
      return [
        { id: "jpg", label: "JPG", icon: "🖼️" },
        { id: "webp", label: "WebP", icon: "🖼️" },
        { id: "pdf", label: "PDF", icon: "📄", toolSlug: "png-to-pdf" },
      ];
    case "gif":
    case "bmp":
      return [
        { id: "jpg", label: "JPG", icon: "🖼️" },
        { id: "png", label: "PNG", icon: "🖼️" },
        { id: "pdf", label: "PDF", icon: "📄" },
      ];
    case "xlsx":
    case "xls":
      return [{ id: "pdf", label: "PDF", icon: "📄", toolSlug: "excel-to-pdf" }];
    case "docx":
    case "doc":
      return [{ id: "pdf", label: "PDF", icon: "📄", toolSlug: "word-to-pdf" }];
    default:
      return [{ id: "pdf", label: "PDF", icon: "📄" }];
  }
}

export type SeoConversionLink = {
  from: FormatId;
  to: TargetId;
  label: string;
  href: string;
};

/** SEO grid: popular conversion shortcuts */
export function getSeoConversionLinks(): SeoConversionLink[] {
  const pairs: Array<{ from: FormatId; to: TargetId }> = [
    { from: "pdf", to: "docx" },
    { from: "pdf", to: "jpg" },
    { from: "pdf", to: "png" },
    { from: "pdf", to: "html" },
    { from: "pdf", to: "txt" },
    { from: "pdf", to: "xlsx" },
    { from: "jpg", to: "pdf" },
    { from: "png", to: "pdf" },
    { from: "webp", to: "pdf" },
    { from: "heic", to: "jpg" },
    { from: "heic", to: "png" },
    { from: "heic", to: "pdf" },
    { from: "webp", to: "jpg" },
    { from: "webp", to: "png" },
    { from: "xlsx", to: "pdf" },
    { from: "jpg", to: "png" },
    { from: "png", to: "jpg" },
  ];

  return pairs.map(({ from, to }) => ({
    from,
    to,
    label: `${formatLabel(from)} to ${formatLabel(to)}`,
    href: universalConverterPath(from, to),
  }));
}

/** Wouter-safe path (locale is applied by router base). */
export function universalConverterPath(from: string, to: string): string {
  return `/universal-converter?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export function parseQueryFormats(
  search: string,
): { from?: FormatId; to?: TargetId } {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const from = params.get("from") as FormatId | null;
  const to = params.get("to") as TargetId | null;
  return {
    from: from && EXT_MAP[from] ? from : undefined,
    to: to ? (to as TargetId) : undefined,
  };
}
