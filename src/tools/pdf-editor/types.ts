import type { PDFDocumentProxy } from "pdfjs-dist";

// ---- Annotation Types (existing, plus new ones) ----

export type AnnotationTool =
  | "cursor"
  | "text"
  | "pen"
  | "highlight"
  | "rect"
  | "line"
  | "eraser"
  | "image"
  | "sticky-note"
  | "signature"
  | "form-field"
  | "select-move";

export interface BaseAnnotation {
  id: string;
  page: number;
}

export interface PenAnnotation extends BaseAnnotation {
  type: "pen";
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  size: number;
  color: string;
  font: string;
}

export interface RectAnnotation extends BaseAnnotation {
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  lineWidth: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  imageData: string;
}

export interface StickyNoteAnnotation extends BaseAnnotation {
  type: "sticky-note";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
}

export interface SignatureAnnotation extends BaseAnnotation {
  type: "signature";
  x: number;
  y: number;
  w: number;
  h: number;
  imageData: string;
}

export interface FormFieldAnnotation extends BaseAnnotation {
  type: "form-field";
  x: number;
  y: number;
  w: number;
  h: number;
  fieldName: string;
  value: string;
  fieldType: "text" | "checkbox" | "radio" | "dropdown";
}

export type Annotation =
  | PenAnnotation
  | TextAnnotation
  | RectAnnotation
  | HighlightAnnotation
  | LineAnnotation
  | ImageAnnotation
  | StickyNoteAnnotation
  | SignatureAnnotation
  | FormFieldAnnotation;

// ---- Canvas Dimensions ----

export interface CanvasDim {
  width: number;
  height: number;
  pdfWidth: number;
  pdfHeight: number;
}

// ---- PDF Text Positions (for text editing) ----

export interface TextItemPosition {
  str: string;
  transform: number[];
  width: number;
  height: number;
  page: number;
  itemIndex: number;
}

// ---- Page Management ----

export interface PageInfo {
  pageNumber: number;
  rotation: number;
  width: number;
  height: number;
}

// ---- Form Field Types ----

export interface PDFFormField {
  id: string;
  type: "text" | "checkbox" | "radio" | "dropdown";
  name: string;
  value: string;
  rect: { x: number; y: number; width: number; height: number };
  page: number;
  options?: string[];
}

// ---- Editing State ----

export interface SelectedObject {
  id: string;
  type: Annotation["type"];
  x: number;
  y: number;
}

// ---- PDF Document Handle ----

export interface PDFDocumentHandle {
  pdfDoc: PDFDocumentProxy;
  file: File;
  pageCount: number;
  pages: PDFDocumentProxy[];
}
