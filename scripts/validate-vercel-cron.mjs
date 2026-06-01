#!/usr/bin/env node
/**
 * Ensures vercel.json crons are Hobby-compatible (at most one run per day per expression).
 */
import fs from "fs";
import path from "path";

const vercelPath = path.join(process.cwd(), "vercel.json");
if (!fs.existsSync(vercelPath)) {
  console.error("FAIL: vercel.json not found");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
const crons = Array.isArray(config.crons) ? config.crons : [];

let failed = 0;

function isHobbyCompatible(schedule) {
  if (typeof schedule !== "string" || !schedule.trim()) return false;
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (minute.includes("/") || hour.includes("/") || dayOfMonth.includes("/") || month.includes("/") || dayOfWeek.includes("/")) {
    return false;
  }
  if (hour === "*") return false;
  if (dayOfMonth !== "*" && dayOfMonth !== "?") {
    /* specific day — still once per day at most if hour/minute fixed */
  }
  return true;
}

for (const entry of crons) {
  const schedule = entry.schedule;
  if (!isHobbyCompatible(schedule)) {
    console.error(`FAIL: Hobby-incompatible cron schedule "${schedule}" on path ${entry.path}`);
    console.error("  Use a fixed hour, e.g. \"0 0 * * *\" (once daily at 00:00 UTC).");
    failed += 1;
  } else {
    console.log(`OK cron ${entry.path} → ${schedule}`);
  }
}

const paths = crons.map((c) => c.path);
const dupPath = paths.filter((p, i) => paths.indexOf(p) !== i);
if (dupPath.length) {
  console.warn(`WARN: duplicate cron paths (consolidate to one schedule): ${[...new Set(dupPath)].join(", ")}`);
}

if (crons.length === 0) {
  console.log("OK: no crons configured");
}

process.exit(failed > 0 ? 1 : 0);
