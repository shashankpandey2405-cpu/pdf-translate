const MAGIC = new TextEncoder().encode("PDFTRUSTENC1");
const SALT_LEN = 16;
const IV_LEN = 12;
const PBKDF2_ITERATIONS = 120_000;

async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Client-side AES-256-GCM wrapper around PDF bytes (RAM-only; not Adobe Acrobat compatibility). */
export async function protectPdfWithPassword(file: File, userPassword: string): Promise<Uint8Array> {
  if (!userPassword || userPassword.length < 4) {
    throw new Error("Choose a password with at least 4 characters.");
  }

  const plain = new Uint8Array(await file.arrayBuffer());
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(userPassword, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);

  const cipherBytes = new Uint8Array(cipher);
  const out = new Uint8Array(MAGIC.length + SALT_LEN + IV_LEN + cipherBytes.byteLength);
  out.set(MAGIC, 0);
  out.set(salt, MAGIC.length);
  out.set(iv, MAGIC.length + SALT_LEN);
  out.set(cipherBytes, MAGIC.length + SALT_LEN + IV_LEN);
  return out;
}

export async function protectPdfBlob(file: File, userPassword: string): Promise<Blob> {
  const out = await protectPdfWithPassword(file, userPassword);
  const buf = new ArrayBuffer(out.byteLength);
  new Uint8Array(buf).set(out);
  return new Blob([buf], { type: "application/octet-stream" });
}

export function getProtectedFilename(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "") || "document";
  return `${base}_protected.pdftrusted`;
}
