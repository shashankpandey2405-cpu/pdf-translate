import DOMPurify from "dompurify";

const DOCX_PREVIEW_TAGS = [
  "p",
  "br",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "colgroup",
  "col",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "sub",
  "sup",
  "a",
  "img",
  "blockquote",
  "hr",
] as const;

const DOCX_PREVIEW_ATTR = ["class", "style", "href", "title", "alt", "colspan", "rowspan", "width", "height"];

/** Sanitize HTML previews (Word, etc.) before dangerouslySetInnerHTML. */
export function sanitizePreviewHtml(html: string): string {
  if (typeof window === "undefined") {
    return html
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/javascript:/gi, "");
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...DOCX_PREVIEW_TAGS],
    ALLOWED_ATTR: DOCX_PREVIEW_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button"],
  });
}
