#!/usr/bin/env node
/**
 * Trust / legal copy audit — flags risky marketing phrases and browser/cloud SEO mismatches.
 *
 * Usage:
 *   node scripts/audit-trust-copy.mjs
 *   node scripts/audit-trust-copy.mjs --json > reports/trust-copy-audit.json
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SEO_FILE = path.join(ROOT, "src", "data", "seo", "toolSeoBundles.ts");
const PROFILES_FILE = path.join(ROOT, "src", "lib", "processing", "toolProfiles.ts");
const LOCALES_DIR = path.join(ROOT, "src", "locales");
const BLOG_FILE = path.join(ROOT, "src", "data", "blog", "posts.ts");

const RISK_PATTERNS = [
  { id: "gdpr_compliant", re: /GDPR[- ]compliant|officially GDPR/i, severity: "high" },
  { id: "ccpa_compliant", re: /CCPA[- ]compliant|complies with CCPA|full compliance with US/i, severity: "high" },
  { id: "pci_claim", re: /PCI-DSS Compliant/i, severity: "high" },
  { id: "never_leave", re: /never leave your device|files never leave|nothing is uploaded/i, severity: "medium" },
  { id: "100_percent_browser", re: /100% in your browser|100% browser|entirely in your browser|100% locally/i, severity: "medium" },
  { id: "world_best", re: /world's most|best in the world|most secure platform|most advanced/i, severity: "high" },
  { id: "accuracy_guarantee", re: /99\.9%|near-100%|100% accuracy/i, severity: "medium" },
  { id: "certified", re: /certified globally|regulator approved|government approved/i, severity: "high" },
  { id: "military_grade", re: /military-grade|zero-knowledge protocol/i, severity: "medium" },
];

const jsonOut = process.argv.includes("--json");

function read(p) {
  return fs.readFileSync(p, "utf8");
}

/** Parse slug → tier from toolProfiles.ts (lightweight). */
function loadProfiles() {
  const text = read(PROFILES_FILE);
  const map = new Map();
  const slugRe = /slug:\s*"([^"]+)"/g;
  const blocks = text.split(/\n\s*(?=\/\/|const |function |export )/);
  let m;
  const allSlugs = [];
  while ((m = slugRe.exec(text)) !== null) allSlugs.push(m[1]);

  const hybrid = new Set();
  const cloudOnly = new Set();
  const hybridCloud = new Set();

  if (text.includes("HYBRID_SLUGS")) {
    const hybridBlock = text.match(/const HYBRID_SLUGS[\s\S]*?^\];/m)?.[0] ?? "";
    for (const s of allSlugs) {
      if (hybridBlock.includes(`slug: "${s}"`)) hybrid.add(s);
    }
  }
  if (text.includes("CLOUD_ONLY_SLUGS")) {
    const cloudBlock = text.match(/const CLOUD_ONLY_SLUGS[\s\S]*?^\];/m)?.[0] ?? "";
    for (const s of allSlugs) {
      if (cloudBlock.includes(`slug: "${s}"`)) cloudOnly.add(s);
    }
  }
  if (text.includes("AI_HYBRID_SLUGS")) {
    const aiBlock = text.match(/const AI_HYBRID_SLUGS[\s\S]*?^\];/m)?.[0] ?? "";
    for (const s of allSlugs) {
      if (aiBlock.includes(`slug: "${s}"`)) hybrid.add(s);
    }
  }

  for (const slug of hybrid) {
    const supportsCloud =
      text.includes(`slug: "${slug}"`) &&
      (text.match(new RegExp(`slug:\\s*"${slug}"[\\s\\S]{0,200}supportsCloud:\\s*true`)) ||
        text.match(new RegExp(`${slug}"[\\s\\S]{0,120}supportsCloud:\\s*true`)));
    if (supportsCloud) hybridCloud.add(slug);
  }

  for (const slug of allSlugs) {
    if (cloudOnly.has(slug)) map.set(slug, "cloud_only");
    else if (hybridCloud.has(slug)) map.set(slug, "hybrid_cloud");
    else if (hybrid.has(slug)) map.set(slug, "hybrid_browser");
    else map.set(slug, "browser_only");
  }
  return map;
}

function scanText(file, content, profiles) {
  const findings = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of RISK_PATTERNS) {
      if (pat.re.test(line)) {
        findings.push({
          file,
          line: i + 1,
          pattern: pat.id,
          severity: pat.severity,
          excerpt: line.trim().slice(0, 160),
        });
      }
    }
  }

  if (file.endsWith("toolSeoBundles.ts")) {
    const slugBlocks = content.split(/^\s{2}"([^"]+)":\s*hub\(/m);
    for (let i = 1; i < slugBlocks.length; i += 2) {
      const slug = slugBlocks[i];
      const body = slugBlocks[i + 1] ?? "";
      const tier = profiles.get(slug) ?? "browser_only";
      const claimsBrowser =
        /100% in your browser|never leave your device|nothing is uploaded|entirely in your browser|100% locally/i.test(
          body,
        );
      if (claimsBrowser && (tier === "cloud_only" || tier === "hybrid_cloud")) {
        findings.push({
          file,
          line: 0,
          pattern: "seo_browser_claim_vs_profile",
          severity: "high",
          excerpt: `Tool "${slug}" (${tier}) SEO claims browser-only processing`,
        });
      }
    }
  }

  return findings;
}

function main() {
  const profiles = loadProfiles();
  const files = [
    SEO_FILE,
    BLOG_FILE,
    path.join(ROOT, "src", "locales", "en.json"),
    ...fs.readdirSync(LOCALES_DIR).map((f) => path.join(LOCALES_DIR, f)),
    path.join(ROOT, "src", "components", "home", "HomeGlobalTrust.tsx"),
    path.join(ROOT, "src", "content", "trustCopy.ts"),
  ].filter((f) => fs.existsSync(f));

  const all = [];
  for (const file of files) {
    all.push(...scanText(path.relative(ROOT, file), read(file), profiles));
  }

  const bySeverity = { high: [], medium: [], low: [] };
  for (const f of all) {
    (bySeverity[f.severity] ?? bySeverity.medium).push(f);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: { high: bySeverity.high.length, medium: bySeverity.medium.length, all: all.length },
    cloudTools: [...profiles.entries()].filter(([, t]) => t === "cloud_only" || t === "hybrid_cloud").map(([s, t]) => ({ slug: s, tier: t })),
    findings: all,
  };

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("PDFTrusted trust copy audit\n");
    console.log(`High: ${report.totals.high}  Medium: ${report.totals.medium}  Total: ${report.totals.all}\n`);
    if (bySeverity.high.length) {
      console.log("--- HIGH ---");
      for (const f of bySeverity.high.slice(0, 40)) {
        console.log(`  [${f.pattern}] ${f.file}:${f.line} — ${f.excerpt}`);
      }
      if (bySeverity.high.length > 40) console.log(`  … +${bySeverity.high.length - 40} more`);
    }
    if (bySeverity.medium.length) {
      console.log("\n--- MEDIUM (first 25) ---");
      for (const f of bySeverity.medium.slice(0, 25)) {
        console.log(`  [${f.pattern}] ${f.file}:${f.line} — ${f.excerpt}`);
      }
    }
    console.log("\nCloud/hybrid tools:", report.cloudTools.map((x) => x.slug).join(", "));
    process.exit(bySeverity.high.length > 0 ? 1 : 0);
  }
}

main();
