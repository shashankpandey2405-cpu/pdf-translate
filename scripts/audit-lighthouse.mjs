#!/usr/bin/env node
/**
 * Run Lighthouse (mobile preset) against local or BASE_URL targets.
 * Requires: production build + server, OR set LIGHTHOUSE_BASE_URL=https://pdftrusted.com
 *
 * Usage:
 *   npm run build && npm start   # in another terminal
 *   npm run audit:lighthouse
 *
 * Gates (env overrides):
 *   LIGHTHOUSE_DEPLOY_MIN_PERF=70   — block deploy if home perf below (default 70)
 *   LIGHTHOUSE_TARGET_PERF=90       — stretch goal logged in summary (default 90)
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORTS = path.join(ROOT, "reports");
const BASE = (process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const TARGETS = [
  { id: "home", path: "/en" },
  { id: "compress", path: "/en/compress-pdf" },
  { id: "resume", path: "/en/resume-builder" },
  { id: "merge", path: "/en/merge-pdf" },
];

const STRETCH = {
  performance: Number(process.env.LIGHTHOUSE_TARGET_PERF ?? 90),
  accessibility: 90,
  bestPractices: 90,
  seo: 90,
  lcpMs: 2500,
  tbtMs: 200,
  cls: 0.1,
};

const DEPLOY_MIN = {
  performance: Number(process.env.LIGHTHOUSE_DEPLOY_MIN_PERF ?? 70),
  accessibility: 85,
  bestPractices: 85,
  seo: 90,
};

function runLighthouse(url, outPath) {
  return new Promise((resolve, reject) => {
    const args = [
      url,
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--quiet",
      "--chrome-flags=--headless --no-sandbox",
      `--output=json`,
      `--output-path=${outPath}`,
    ];
    const child = spawn("npx", ["lighthouse", ...args], {
      stdio: "inherit",
      shell: true,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`lighthouse exited ${code} for ${url}`));
    });
  });
}

function readScores(jsonPath) {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const cats = raw.categories || {};
  const audits = raw.audits || {};
  return {
    performance: Math.round((cats.performance?.score ?? 0) * 100),
    accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
    seo: Math.round((cats.seo?.score ?? 0) * 100),
    lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
    tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
  };
}

function meetsDeployGate(scores) {
  return (
    scores.performance >= DEPLOY_MIN.performance &&
    scores.accessibility >= DEPLOY_MIN.accessibility &&
    scores.bestPractices >= DEPLOY_MIN.bestPractices &&
    scores.seo >= DEPLOY_MIN.seo
  );
}

function meetsStretch(scores) {
  return (
    scores.performance >= STRETCH.performance &&
    scores.accessibility >= STRETCH.accessibility &&
    scores.bestPractices >= STRETCH.bestPractices &&
    scores.seo >= STRETCH.seo
  );
}

async function main() {
  fs.mkdirSync(REPORTS, { recursive: true });
  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    deployGate: DEPLOY_MIN,
    stretchGoal: STRETCH,
    targets: [],
    note: "Set LIGHTHOUSE_BASE_URL for production runs. Server must be reachable.",
  };

  let deployOk = true;

  for (const t of TARGETS) {
    const url = `${BASE}${t.path}`;
    const outPath = path.join(REPORTS, `lighthouse-${t.id}.json`);
    console.log(`\n[lighthouse] ${url} → ${outPath}`);
    try {
      await runLighthouse(url, outPath);
      const scores = readScores(outPath);
      const passDeploy = meetsDeployGate(scores);
      const passStretch = meetsStretch(scores);
      if (t.id === "home" && !passDeploy) deployOk = false;
      manifest.targets.push({
        id: t.id,
        url,
        scores,
        passDeploy,
        passStretch,
        pass: passStretch,
      });
      console.log(
        `[lighthouse] ${t.id} perf=${scores.performance} deploy=${passDeploy ? "PASS" : "FAIL"} stretch=${passStretch ? "PASS" : "FAIL"}`,
      );
    } catch (e) {
      deployOk = false;
      manifest.targets.push({
        id: t.id,
        url,
        error: e instanceof Error ? e.message : String(e),
        passDeploy: false,
        passStretch: false,
        pass: false,
      });
    }
  }

  manifest.deployGatePass = deployOk;
  const summaryPath = path.join(REPORTS, "lighthouse-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(manifest, null, 2));
  console.log(`\n[lighthouse] Summary → ${summaryPath}`);
  console.log(
    `[lighthouse] Deploy gate (home perf ≥ ${DEPLOY_MIN.performance}): ${deployOk ? "PASS" : "FAIL"}`,
  );
  console.log(`[lighthouse] Stretch goal (perf ≥ ${STRETCH.performance}): see per-target passStretch`);

  if (!deployOk && process.env.LIGHTHOUSE_STRICT === "1") {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
