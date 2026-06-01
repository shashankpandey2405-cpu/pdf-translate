#!/usr/bin/env node
/**
 * Route/link integrity audit (static).
 *
 * Checks:
 * - Routes declared in src/App.tsx
 * - Tool/resource hrefs from constants/tools.js
 * - Sitemap paths from public/sitemap-*.xml
 *
 * Output: prints mismatches and exits non-zero if any hard failures found.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP_FILE = path.join(ROOT, "src", "App.tsx");
const TOOLS_FILE = path.join(ROOT, "constants", "tools.js");
const PUBLIC_DIR = path.join(ROOT, "public");

const LOCALES = new Set(["en", "hi", "zh", "ar", "es", "fr", "de"]);

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function normalizePath(p) {
  if (!p) return "";
  const clean = p.trim();
  if (!clean.startsWith("/")) return `/${clean}`;
  return clean;
}

function stripLocalePrefix(urlPath) {
  const p = normalizePath(urlPath);
  const parts = p.split("/").filter(Boolean);
  if (!parts.length) return "/";
  if (LOCALES.has(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return p;
}

function isDynamicRoute(routePath) {
  return routePath.includes(":") || routePath.includes("*");
}

function matchesDynamicRoute(dynamicRoute, concretePath) {
  const dyn = normalizePath(dynamicRoute);
  const conc = normalizePath(concretePath);
  const dynParts = dyn.split("/").filter(Boolean);
  const concParts = conc.split("/").filter(Boolean);
  if (dynParts.length !== concParts.length) return false;
  for (let i = 0; i < dynParts.length; i += 1) {
    const dp = dynParts[i];
    const cp = concParts[i];
    if (!dp || !cp) return false;
    if (dp.startsWith(":")) continue;
    if (dp !== cp) return false;
  }
  return true;
}

function parseRoutesFromAppTsx(appSrc) {
  const routes = new Set();
  const redirects = [];

  // Matches: <Route path="/foo" ...> or <Route path="/foo"> ... </Route>
  for (const m of appSrc.matchAll(/<Route\s+path="([^"]+)"[^>]*>/g)) {
    routes.add(normalizePath(m[1]));
  }

  // Matches Redirect to="/foo"
  for (const m of appSrc.matchAll(/<Redirect\s+to="([^"]+)"\s*\/?>/g)) {
    redirects.push(normalizePath(m[1]));
  }

  return { routes, redirects };
}

function parseSitemapPaths() {
  const files = fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => (f.startsWith("sitemap-") || f === "sitemap.xml") && f.endsWith(".xml"));

  const locs = [];
  for (const f of files) {
    const xml = readText(path.join(PUBLIC_DIR, f));
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      locs.push(m[1]);
    }
  }

  const urlPaths = locs
    .map((u) => {
      try {
        return new URL(u).pathname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const basePaths = new Set(urlPaths.map((p) => stripLocalePrefix(p)));
  return { files, basePaths };
}

function parseHrefsFromToolsJs(src) {
  const hrefs = new Set();

  // Match: href: "/pricing" (resource links etc)
  for (const m of src.matchAll(/href:\s*"([^"]+)"/g)) {
    hrefs.add(normalizePath(m[1]));
  }

  // Match: routePath: "/tools/ai-scanner"
  for (const m of src.matchAll(/routePath:\s*"([^"]+)"/g)) {
    hrefs.add(normalizePath(m[1]));
  }

  // Match: slug: "merge-pdf" → implicit route /merge-pdf (unless override exists)
  for (const m of src.matchAll(/slug:\s*"([^"]+)"/g)) {
    const slug = m[1];
    if (!slug) continue;
    // Filter out non-page pseudo entries.
    if (slug === "all-tools" || slug === "pricing") continue;
    hrefs.add(normalizePath(`/${slug}`));
  }

  return hrefs;
}

function main() {
  const appSrc = readText(APP_FILE);
  const toolsSrc = readText(TOOLS_FILE);

  const { routes } = parseRoutesFromAppTsx(appSrc);
  const { basePaths, files: sitemapFiles } = parseSitemapPaths();
  const toolHrefs = parseHrefsFromToolsJs(toolsSrc);

  const staticRoutes = new Set([...routes].filter((r) => !isDynamicRoute(r)));
  const dynamicRoutes = [...routes].filter((r) => isDynamicRoute(r));

  // Everything that should resolve via routing (excluding internal-only routes we don't want in sitemap).
  const expected = new Set([...basePaths, ...toolHrefs].map((p) => stripLocalePrefix(p)));

  // Allow these to exist only as dynamic/fallback:
  const allowViaFallback = new Set(["/:toolId"]);
  for (const r of allowViaFallback) expected.delete(r);

  const missing = [];
  for (const p of expected) {
    if (p === "/") continue;
    if (staticRoutes.has(p)) continue;
    if (dynamicRoutes.some((d) => matchesDynamicRoute(d, p))) continue;
    // Some pages intentionally resolved by ToolOrDedicatedPage fallback (/:toolId)
    if (!p.includes("/") || p.split("/").filter(Boolean).length === 1) {
      // single segment paths can be handled by /:toolId
      continue;
    }
    missing.push(p);
  }

  const unknownInSitemap = [];
  const helpPrefixes = ["/guides/", "/faq/", "/learn/", "/help/"];
  for (const p of basePaths) {
    if (p === "/") continue;
    if (staticRoutes.has(p)) continue;
    // allow /compare/:competitor and /blog/:slug via dynamic routes
    if (p.startsWith("/compare/") || p.startsWith("/blog/")) continue;
    if (helpPrefixes.some((prefix) => p.startsWith(prefix))) {
      if (dynamicRoutes.some((d) => matchesDynamicRoute(d, p))) continue;
    }
    // allow /:toolId fallback for 1-segment
    const segs = p.split("/").filter(Boolean);
    if (segs.length === 1) continue;
    unknownInSitemap.push(p);
  }

  console.log("=== Route audit (static) ===");
  console.log("App routes:", routes.size, "static:", staticRoutes.size, "dynamic:", dynamicRoutes.length);
  console.log("Sitemap files:", sitemapFiles.length, "base paths:", basePaths.size);
  console.log("Tools/resource href candidates:", toolHrefs.size);
  console.log("");

  if (missing.length) {
    console.log("MISSING route definitions for:");
    for (const p of missing.sort()) console.log("  -", p);
    console.log("");
  }

  if (unknownInSitemap.length) {
    console.log("SITEMAP paths not matched by static/dynamic allowlist:");
    for (const p of unknownInSitemap.sort()) console.log("  -", p);
    console.log("");
  }

  if (!missing.length && !unknownInSitemap.length) {
    console.log("OK: sitemap + tool links appear routable.");
    process.exit(0);
  }

  process.exit(1);
}

main();

