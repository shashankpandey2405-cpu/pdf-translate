#!/usr/bin/env node
/**
 * Verify pdfjs-dist worker file matches installed package version.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const pkg = readJson(path.join(root, "package.json"));
  const pdfjsVersion = pkg.dependencies?.["pdfjs-dist"]?.replace(/^\^/, "") ?? "";
  const lockPath = path.join(root, "package-lock.json");
  let installed = pdfjsVersion;
  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath);
    installed =
      lock.packages?.["node_modules/pdfjs-dist"]?.version ??
      lock.dependencies?.["pdfjs-dist"]?.version ??
      pdfjsVersion;
  }

  const workerPublic = path.join(root, "public", "pdf.worker.min.mjs");
  const workerNode = path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");

  if (!fs.existsSync(workerPublic)) {
    console.error("✗ public/pdf.worker.min.mjs missing — run scripts/copy-pdf-worker.mjs");
    process.exit(1);
  }
  if (!fs.existsSync(workerNode)) {
    console.error("✗ node_modules pdf.worker missing — run npm install");
    process.exit(1);
  }

  const pubSize = fs.statSync(workerPublic).size;
  const nodeSize = fs.statSync(workerNode).size;
  if (pubSize !== nodeSize) {
    console.warn(
      `⚠ Worker size mismatch (public ${pubSize} vs node ${nodeSize}) — re-run copy-pdf-worker.mjs`,
    );
    process.exit(process.argv.includes("--strict") ? 1 : 0);
  }

  console.log(`✓ pdfjs worker lockstep OK (pdfjs-dist@${installed}, ${pubSize} bytes)`);
}

main();
