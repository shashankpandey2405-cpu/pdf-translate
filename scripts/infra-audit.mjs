#!/usr/bin/env node
/**
 * Lightweight infrastructure/env audit (no network calls).
 *
 * This repo is often used in multiple deployment shapes (Vercel Next.js + Railway workers + R2).
 * In some workspace copies this file may be missing while package.json references it.
 *
 * What it does:
 * - Verifies key config files exist (vercel.json, wrangler.toml, sitemap, etc.)
 * - Prints missing environment variables (best-effort; does NOT fail hard by default)
 *
 * Exit codes:
 * - 0: always, unless a required config file is missing
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function requiredFile(relPath) {
  if (!exists(relPath)) {
    console.error(`[infra] MISSING required file: ${relPath}`);
    return false;
  }
  return true;
}

function getEnv(key) {
  const v = process.env[key];
  if (typeof v !== "string") return "";
  return v.trim();
}

function isSet(key) {
  return Boolean(getEnv(key));
}

function main() {
  console.log("=== PDFTrusted infra audit (static) ===");

  const okFiles = [
    requiredFile("package.json"),
    requiredFile("vercel.json"),
    requiredFile("public/sitemap.xml"),
    requiredFile("public/robots.txt"),
  ].every(Boolean);

  // Optional (depends on deployment shape)
  const optional = [
    "wrangler.toml",
    "backend-service/Dockerfile.worker",
    "scripts/audit-routes.mjs",
  ];
  for (const f of optional) {
    if (!exists(f)) console.log(`[infra] optional file not present: ${f}`);
  }

  const envGroups = {
    supabase: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    redis: ["REDIS_URL", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    r2_s3: ["S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"],
    callbacks: ["ENHANCED_CALLBACK_URL", "NEXT_PUBLIC_APP_URL"],
    worker_auth: ["RENDER_WORKER_SECRET"],
    ai: ["OPENROUTER_API_KEY"],
    paypal: ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID"],
  };

  console.log("");
  console.log("Env status (missing keys listed):");
  for (const [group, keys] of Object.entries(envGroups)) {
    const missing = keys.filter((k) => !isSet(k));
    const present = keys.length - missing.length;
    console.log(`- ${group}: ${present}/${keys.length} set`);
    if (missing.length) {
      for (const k of missing) console.log(`  - missing: ${k}`);
    }
  }

  // Soft guidance for Redis:
  if (!isSet("REDIS_URL") && !(isSet("UPSTASH_REDIS_REST_URL") && isSet("UPSTASH_REDIS_REST_TOKEN"))) {
    console.log("");
    console.log("[infra] NOTE: Redis not configured. Cloud queues/limits will return 503 in production.");
  }

  if (!okFiles) process.exit(1);
  process.exit(0);
}

main();

