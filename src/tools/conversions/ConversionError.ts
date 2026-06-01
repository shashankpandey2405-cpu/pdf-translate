/** Structured failure for client-side conversions (Excel/PDF, etc.) */
export type ConversionErrorCode = "STRUCTURE" | "EMPTY" | "ENCRYPTED" | "UNSUPPORTED" | "UNKNOWN";

export class ConversionError extends Error {
  readonly code: ConversionErrorCode;

  constructor(code: ConversionErrorCode, message: string) {
    super(message);
    this.name = "ConversionError";
    this.code = code;
  }
}

export function isConversionError(e: unknown): e is ConversionError {
  return e instanceof ConversionError;
}
