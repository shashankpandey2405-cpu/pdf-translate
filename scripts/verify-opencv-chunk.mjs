#!/usr/bin/env node
/**
 * Verify OpenCV stays in async vendor-opencv chunk (not initial / layout bundles).
 * Run after `npm run build`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextDir = path.join(root, ".next");
const staticDir = path.join(nextDir, "static", "chunks");

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function main() {
  if (!fs.existsSync(nextDir)) {
    console.error("verify-opencv-chunk: run `npm run build` first.");
    process.exit(1);
  }

  const chunks = walkFiles(staticDir).filter((f) => f.endsWith(".js"));
  const opencvChunks = chunks.filter((f) => /vendor-opencv|opencv-js/.test(path.basename(f)));
  const initialSuspects = chunks.filter((f) => {
    const base = path.basename(f);
    if (/vendor-opencv|opencv-js/.test(base)) return false;
    if (!/^(main|layout|webpack|framework|pages\/|app\/)/.test(base.replace(/\\/g, "/"))) {
      return false;
    }
    const text = fs.readFileSync(f, "utf8");
    return text.includes("opencv-js") || text.includes("@techstark/opencv");
  });

  const report = {
    generatedAt: new Date().toISOString(),
    opencvAsyncChunks: opencvChunks.map((f) => path.relative(staticDir, f)),
    initialBundleLeaks: initialSuspects.map((f) => path.relative(staticDir, f)),
    ok: opencvChunks.length > 0 && initialSuspects.length === 0,
  };

  const outPath = path.join(root, "reports", "opencv-chunk-audit.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (!report.ok) {
    console.error("verify-opencv-chunk: FAILED");
    if (opencvChunks.length === 0) console.error("  - no vendor-opencv chunk found");
    if (initialSuspects.length > 0) {
      console.error("  - OpenCV referenced in initial bundles:");
      for (const f of initialSuspects) console.error(`    ${path.relative(staticDir, f)}`);
    }
    process.exit(1);
  }

  console.log(`verify-opencv-chunk: OK (${opencvChunks.length} async chunk(s), 0 leaks)`);
}

main();
