import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = path.join(root, "public/pdf.worker.min.mjs");

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("✓ Copied pdf.worker.min.mjs → public/pdf.worker.min.mjs");
} else {
  console.warn("pdf.worker.min.mjs not found; pdf.js may fail in browser");
}
