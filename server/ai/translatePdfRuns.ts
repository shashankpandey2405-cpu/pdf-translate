export type TranslatedPdfRun = {
  id?: string;
  pageIndex: number;
  text: string;
  translated: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName?: string;
  rotation?: number;
};
