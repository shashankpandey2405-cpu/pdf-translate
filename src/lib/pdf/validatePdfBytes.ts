/** True when bytes look like a non-empty PDF (%PDF header). */
export function isValidPdfBytes(bytes: Uint8Array | ArrayBuffer): boolean {
  const view =
    bytes instanceof ArrayBuffer
      ? new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 8))
      : bytes.subarray(0, Math.min(bytes.byteLength, 8));
  if (view.byteLength < 5) return false;
  return (
    view[0] === 0x25 &&
    view[1] === 0x50 &&
    view[2] === 0x44 &&
    view[3] === 0x46 &&
    view[4] === 0x2d
  );
}

export function pdfBytesToBlob(bytes: Uint8Array, mime = "application/pdf"): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: mime });
}
