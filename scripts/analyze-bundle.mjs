#!/usr/bin/env node
/** Run Next build with @next/bundle-analyzer when installed. */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

process.env.ANALYZE = "true";

const result = spawnSync("npx", ["next", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ANALYZE: "true" },
});

process.exit(result.status ?? 1);
