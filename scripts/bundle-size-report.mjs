#!/usr/bin/env node
/**
 * Summarize Next.js client bundle sizes after `npm run build`.
 * Usage:
 *   node scripts/bundle-size-report.mjs          # write reports/bundle-sizes.json
 *   node scripts/bundle-size-report.mjs --gate   # fail CI if budgets exceeded
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextDir = path.join(root, ".next");
const outPath = path.join(root, "reports", "bundle-sizes.json");
const gate = process.argv.includes("--gate");

/** Phase 1 budgets — largestInitial excludes lazy vendor-* chunks (opencv, mupdf, etc.). */
const BUDGETS = {
  totalClientJsBytes: 20 * 1024 * 1024,
  largestChunkBytes: 6 * 1024 * 1024,
};

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

function main() {
  if (!fs.existsSync(nextDir)) {
    console.error("bundle-size-report: run `npm run build` first (.next missing).");
    process.exit(gate ? 1 : 0);
  }

  const staticDir = path.join(nextDir, "static", "chunks");
  const chunkFiles = walkFiles(staticDir).filter((f) => f.endsWith(".js"));
  const chunks = chunkFiles.map((file) => {
    const stat = fs.statSync(file);
    return {
      name: path.relative(staticDir, file).replace(/\\/g, "/"),
      bytes: stat.size,
    };
  });
  chunks.sort((a, b) => b.bytes - a.bytes);

  const totalClientJsBytes = chunks.reduce((sum, c) => sum + c.bytes, 0);
  const largestChunk = chunks[0] ?? { name: "(none)", bytes: 0 };
  /** Async vendor splits (opencv, mupdf, etc.) — lazy-loaded, not first paint. */
  const initialChunks = chunks.filter((c) => !/^vendor-/.test(c.name));
  const largestInitialChunk = initialChunks[0] ?? largestChunk;
  const largestAsyncVendor = chunks.find((c) => /^vendor-/.test(c.name)) ?? null;

  const appPaths = readJson(path.join(nextDir, "server", "app-paths-manifest.json")) ?? {};
  const pageRoutes = Object.keys(appPaths).filter((r) => !r.startsWith("/_not-found"));

  const polyfillPath = path.join(staticDir, "polyfills.js");
  const polyfillBytes = fs.existsSync(polyfillPath) ? fs.statSync(polyfillPath).size : 0;

  const report = {
    generatedAt: new Date().toISOString(),
    totalClientJsBytes,
    largestChunk: { name: largestChunk.name, bytes: largestChunk.bytes },
    largestInitialChunk: { name: largestInitialChunk.name, bytes: largestInitialChunk.bytes },
    largestAsyncVendor: largestAsyncVendor
      ? { name: largestAsyncVendor.name, bytes: largestAsyncVendor.bytes }
      : null,
    topChunks: chunks.slice(0, 20),
    totalPageRoutes: pageRoutes.length,
    topPages: pageRoutes.slice(0, 15).map((route) => ({ route, files: 0, bytes: 0 })),
    polyfillBytes,
    budgets: BUDGETS,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`✓ Wrote ${path.relative(root, outPath)}`);
  console.log(`  Client JS total: ${formatBytes(totalClientJsBytes)} (${chunks.length} chunks)`);
  console.log(`  Largest chunk:   ${largestChunk.name} — ${formatBytes(largestChunk.bytes)}`);
  console.log(
    `  Largest initial: ${largestInitialChunk.name} — ${formatBytes(largestInitialChunk.bytes)} (gate)`,
  );

  if (!gate) return;

  const violations = [];
  if (totalClientJsBytes > BUDGETS.totalClientJsBytes) {
    violations.push(
      `total client JS ${formatBytes(totalClientJsBytes)} exceeds budget ${formatBytes(BUDGETS.totalClientJsBytes)}`,
    );
  }
  if (largestInitialChunk.bytes > BUDGETS.largestChunkBytes) {
    violations.push(
      `largest initial chunk ${formatBytes(largestInitialChunk.bytes)} exceeds budget ${formatBytes(BUDGETS.largestChunkBytes)}`,
    );
  }

  if (violations.length) {
    console.error("✗ Bundle budget gate failed:");
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }
  console.log("✓ Bundle budget gate passed");
}

main();
