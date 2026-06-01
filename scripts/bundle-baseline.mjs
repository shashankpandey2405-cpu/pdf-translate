#!/usr/bin/env node
/**
 * Record bundle baseline + delta after upgrade phases.
 * Reads reports/bundle-sizes.json and writes reports/bundle-delta.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sizesPath = path.join(root, "reports", "bundle-sizes.json");
const baselinePath = path.join(root, "reports", "bundle-baseline.json");
const deltaPath = path.join(root, "reports", "bundle-delta.json");

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const current = readJson(sizesPath);
  if (!current) {
    console.error("Run npm run build first (reports/bundle-sizes.json missing).");
    process.exit(1);
  }

  const phase = process.argv.find((a) => a.startsWith("--phase="))?.split("=")[1] ?? "unknown";
  let baseline = readJson(baselinePath);

  if (!baseline || process.argv.includes("--init")) {
    baseline = { ...current, phase: "baseline", note: "Initial mega-chunk baseline" };
    fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`✓ Wrote baseline ${path.relative(root, baselinePath)}`);
    console.log(`  Largest: ${(baseline.largestChunk.bytes / (1024 * 1024)).toFixed(2)} MB`);
    return;
  }

  const delta = {
    generatedAt: new Date().toISOString(),
    phase,
    baseline: {
      totalClientJsBytes: baseline.totalClientJsBytes,
      largestChunkBytes: baseline.largestChunk.bytes,
      largestChunkName: baseline.largestChunk.name,
    },
    current: {
      totalClientJsBytes: current.totalClientJsBytes,
      largestChunkBytes: current.largestChunk.bytes,
      largestChunkName: current.largestChunk.name,
    },
    deltaBytes: {
      total: current.totalClientJsBytes - baseline.totalClientJsBytes,
      largestChunk: current.largestChunk.bytes - baseline.largestChunk.bytes,
    },
    deltaPercent: {
      total: ((current.totalClientJsBytes - baseline.totalClientJsBytes) / baseline.totalClientJsBytes) * 100,
      largestChunk:
        ((current.largestChunk.bytes - baseline.largestChunk.bytes) / baseline.largestChunk.bytes) * 100,
    },
  };

  fs.writeFileSync(deltaPath, `${JSON.stringify(delta, null, 2)}\n`);
  console.log(`✓ Wrote ${path.relative(root, deltaPath)} (phase: ${phase})`);
  console.log(
    `  Largest chunk: ${(delta.current.largestChunkBytes / (1024 * 1024)).toFixed(2)} MB (${delta.deltaPercent.largestChunk.toFixed(1)}% vs baseline)`,
  );
}

main();
