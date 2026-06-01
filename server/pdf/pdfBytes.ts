/** PDF byte helpers for workers and analyze routes. */

export function hasPdfHeader(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export function pdfHeaderHint(bytes: Uint8Array): string {
  if (!bytes.length) return "empty";
  const head = bytes.subarray(0, Math.min(8, bytes.length));
  return Array.from(head, (b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : `.`)).join("");
}

export function normalizePdfBytes(bytes: Uint8Array): Uint8Array {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes;
  }
  return bytes.slice();
}

/** Copy for pdf.js (detached ArrayBuffer). */
export function detachedPdfBytes(bytes: Uint8Array): Uint8Array {
  return normalizePdfBytes(bytes).slice();
}
