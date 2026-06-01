#!/usr/bin/env node
/**
 * Pre-deploy production env validation.
 * Usage: node scripts/validate-production-env.mjs
 * Loads .env.local if present (does not fail if missing).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvFile(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "RENDER_WORKER_SECRET",
];

const ENHANCED = [
  "NEXT_PUBLIC_ENHANCED_ENABLED",
  "ENHANCED_CALLBACK_URL",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_ENDPOINT",
];

const REDIS_ANY = ["REDIS_URL", "UPSTASH_REDIS_REST_URL"];

function hasAny(keys) {
  return keys.some((k) => (process.env[k] ?? "").trim());
}

let failed = false;

for (const key of REQUIRED) {
  if (!(process.env[key] ?? "").trim()) {
    console.error(`✗ missing required: ${key}`);
    failed = true;
  } else {
    console.log(`✓ ${key}`);
  }
}

if (!hasAny(REDIS_ANY)) {
  console.error("✗ missing Redis: set REDIS_URL or UPSTASH_REDIS_REST_URL");
  failed = true;
} else {
  console.log("✓ Redis config present");
}

const enhancedOn =
  process.env.NEXT_PUBLIC_ENHANCED_ENABLED === "true" ||
  process.env.VITE_ENHANCED_ENABLED === "true";

if (enhancedOn) {
  for (const key of ENHANCED) {
    if (!(process.env[key] ?? "").trim()) {
      console.error(`✗ enhanced mode requires: ${key}`);
      failed = true;
    } else {
      console.log(`✓ ${key}`);
    }
  }
}

if (failed) {
  console.error("\nProduction env validation FAILED");
  process.exit(1);
}
console.log("\nProduction env validation PASSED");
