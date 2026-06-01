#!/usr/bin/env node
/**
 * Ensures QA bypass flags are not enabled for production deployments.
 * Used by npm run audit:predeploy and CI.
 */

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function envTrue(v) {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
}

if (process.env.VERCEL_ENV === "production") {
  if (envTrue(process.env.PDFTRUSTED_QA_MODE)) {
    fail("PDFTRUSTED_QA_MODE must not be set on Vercel production");
  }
  if (envTrue(process.env.NEXT_PUBLIC_PDFTRUSTED_QA_MODE)) {
    fail("NEXT_PUBLIC_PDFTRUSTED_QA_MODE must not be set on Vercel production");
  }
}

const riskyFiles = [".env", ".env.local", ".env.production", ".env.production.local"];
for (const name of riskyFiles) {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^PDFTRUSTED_QA_MODE\s*=\s*(true|1)\s*$/i.test(trimmed)) {
      fail(`${name} enables PDFTRUSTED_QA_MODE — remove before production deploy`);
    }
    if (/^NEXT_PUBLIC_PDFTRUSTED_QA_MODE\s*=\s*(true|1)\s*$/i.test(trimmed)) {
      fail(`${name} enables NEXT_PUBLIC_PDFTRUSTED_QA_MODE — remove before production deploy`);
    }
  }
}

console.log("OK: production QA guard passed");
