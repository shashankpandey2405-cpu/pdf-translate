import { ConversionError, isConversionError } from "@/tools/conversions/ConversionError";
import { withSilentRecovery } from "@/lib/processingRecovery";
import { excelFileToPdf } from "@/tools/excel-to-pdf/logic";
import { pdfFileToExcel } from "@/tools/pdf-to-excel/logic";
import { pdfToWord, getWordFilename } from "@/tools/pdf-to-word/logic";
import { pdfToEpubBytes, getEpubFilename } from "@/tools/pdf-to-epub/logic";
import { TOOL_GROUPS_BY_SLUG } from "../../../constants/tools";
import { getToolImplementationStatus } from "../../../constants/toolStatus";

export type ToolProcessor = "passthrough" | "conversion" | "custom";

export type ToolPipelineConfig = {
  slug: string;
  accept: string;
  multiple: boolean;
  processor: ToolProcessor;
  maxFilesGuest: number;
  maxFilesAuthed: number;
  maxSizeMbGuest: number;
  maxSizeMbAuthed: number;
  routePath?: string;
};

type ToolOutput = { blob: Blob; filename: string };

/** Subtle feedback only — skip extra wait when work already took ≥1s. */
export const MIN_PROCESSING_DURATION_MS = 600;
export const MIN_PROCESSING_SKIP_IF_ELAPSED_MS = 1000;

export function conversionErrorMessage(e: unknown, t?: (key: string) => string): string {
  if (isConversionError(e)) {
    if (!t) return e.message;
    const mapKey =
      e.code === "STRUCTURE"
        ? "toolPage.conversionStructureComplex"
        : e.code === "EMPTY"
          ? "toolPage.conversionNoContent"
          : e.code === "ENCRYPTED"
            ? "toolPage.conversionEncrypted"
            : e.code === "UNSUPPORTED"
              ? "toolPage.conversionUnsupported"
              : "toolPage.conversionFailed";
    const localized = t(mapKey);
    return localized !== mapKey ? localized : e.message;
  }
  if (e instanceof Error) return e.message;
  return t ? t("toolPage.processingFailed") : "Processing failed.";
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function withMinimumDuration<T>(promiseWork: Promise<T>, minMs = MIN_PROCESSING_DURATION_MS): Promise<T> {
  const started = Date.now();
  const result = await promiseWork;
  const elapsed = Date.now() - started;
  if (elapsed >= MIN_PROCESSING_SKIP_IF_ELAPSED_MS) return result;
  if (elapsed < minMs) await delay(minMs - elapsed);
  return result;
}

function asBlobPart(data: Uint8Array): BlobPart {
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  return ab;
}

type ConversionHandler = (file: File) => Promise<ToolOutput>;

async function imageFileToPdf(file: File): Promise<ToolOutput> {
  const { runStableBrowserJob } = await import("@/lib/browserSafeProcessing");
  const { imageFileToPdf: toPdf } = await import("@/tools/universal-converter/imagesToPdf");
  return runStableBrowserJob(async () => {
    const { bytes, filename } = await toPdf(file);
    return {
      blob: new Blob([asBlobPart(bytes)], { type: "application/pdf" }),
      filename,
    };
  });
}

async function pdfToImagesZip(file: File, format: "jpeg" | "png"): Promise<ToolOutput> {
  const { buildPdfPageImagesZip } = await import("@/tools/pdf-to-image/logic");
  return buildPdfPageImagesZip(file, format);
}

const conversionHandlers: Partial<Record<string, ConversionHandler>> = {
  "excel-to-pdf": async (file) => {
    const bytes = await excelFileToPdf(file);
    return {
      blob: new Blob([asBlobPart(bytes)], { type: "application/pdf" }),
      filename: file.name.replace(/\.(xls|xlsx)$/i, "") + ".pdf",
    };
  },
  "pdf-to-excel": async (file) => {
    const bytes = await pdfFileToExcel(file);
    return {
      blob: new Blob([asBlobPart(bytes)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      filename: file.name.replace(/\.pdf$/i, "") + ".xlsx",
    };
  },
  "pdf-to-word": async (file) => {
    const bytes = await pdfToWord(file);
    return {
      blob: new Blob([asBlobPart(bytes)], { type: "application/rtf" }),
      filename: getWordFilename(file),
    };
  },
  "pdf-to-image": async (file) => pdfToImagesZip(file, "jpeg"),
  "pdf-to-jpg": async (file) => pdfToImagesZip(file, "jpeg"),
  "pdf-to-png": async (file) => pdfToImagesZip(file, "png"),
  "pdf-to-epub": async (file) => {
    const bytes = await pdfToEpubBytes(file);
    return {
      blob: new Blob([asBlobPart(bytes)], { type: "application/epub+zip" }),
      filename: getEpubFilename(file),
    };
  },
  "jpg-to-pdf": imageFileToPdf,
  "png-to-pdf": imageFileToPdf,
};

export function getToolPipelineConfig(slug: string): ToolPipelineConfig | null {
  const config = (TOOL_GROUPS_BY_SLUG as Record<string, ToolPipelineConfig | undefined>)[slug];
  return config ?? null;
}

export async function processToolOutput(slug: string, file: File): Promise<ToolOutput> {
  if (getToolImplementationStatus(slug) === "coming-soon") {
    throw new ConversionError("UNSUPPORTED", "This tool is not available yet.");
  }
  const config = getToolPipelineConfig(slug);
  if (!config) {
    throw new ConversionError("UNSUPPORTED", "Unknown tool.");
  }
  if (config.processor === "conversion") {
    const handler = conversionHandlers[slug];
    if (!handler) {
      throw new ConversionError("UNSUPPORTED", "Conversion is not implemented for this tool.");
    }
    return handler(file);
  }
  throw new ConversionError("UNSUPPORTED", "Processing is not configured for this tool.");
}

export async function processToolOutputSafe(
  slug: string,
  file: File,
  t?: (key: string) => string,
): Promise<{ blob: Blob; filename: string }> {
  return withSilentRecovery(
    async () => {
      try {
        return await processToolOutput(slug, file);
      } catch (e) {
        if (isConversionError(e)) throw e;
        throw new ConversionError(
          "UNKNOWN",
          e instanceof Error ? e.message : conversionErrorMessage(e, t),
        );
      }
    },
    { maxAttempts: 3, baseDelayMs: 500, t },
  );
}
