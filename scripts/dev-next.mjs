/**
 * Start Next dev on port 3000 after freeing the port (avoids silent fallback to 3001
 * while .env.local still points OAuth at localhost:3000).
 */
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const port = 3000;
const clean = process.argv.includes("--clean");

function killListenersOnPort(p) {
  try {
    const out = execSync(`netstat -ano | findstr ":${p}"`, { encoding: "utf8" });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts.at(-1);
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      console.log(`[dev] Stopping PID ${pid} (port ${p} in use)`);
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

killListenersOnPort(port);

if (clean) {
  const nextDir = join(root, ".next");
  if (existsSync(nextDir)) {
    console.log("[dev] Removing .next cache");
    rmSync(nextDir, { recursive: true, force: true });
  }
}

const child = spawn("npx", ["next", "dev", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT: String(port) },
});

child.on("exit", (code) => process.exit(code ?? 0));
