#!/usr/bin/env node
/** Phase 1 security wiring checks. Run: node scripts/verify-security-phase.mjs */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [
  "server/security/memoryBurstLimit.ts",
  "server/security/apiBurstLimit.ts",
  "server/security/fileMagic.ts",
  "server/security/jobFingerprint.ts",
  "server/env/validateProduction.ts",
  "scripts/validate-production-env.mjs",
  "src/app/api/feedback/route.ts",
];

let failed = false;
for (const rel of checks) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`✗ missing ${rel}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(abs, "utf8");
  console.log(`✓ ${rel}`);
  if (rel.includes("apiBurstLimit") && !text.includes("memoryBurstIncr")) {
    console.error("✗ apiBurstLimit missing memory fallback");
    failed = true;
  }
  if (rel.includes("fileMagic") && !text.includes("%PDF")) {
    console.error("✗ fileMagic incomplete");
    failed = true;
  }
}

const aiProcess = fs.readFileSync(path.join(root, "src/app/api/internal/ai-process/route.ts"), "utf8");
if (aiProcess.includes("if (!cron && !worker) return true")) {
  console.error("✗ ai-process still open without secrets");
  failed = true;
} else {
  console.log("✓ ai-process hardened");
}

if (failed) process.exit(1);
console.log("\nSecurity phase verification PASSED");
