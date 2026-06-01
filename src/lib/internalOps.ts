/** Internal QA routes (cloud-smoke, pipeline diagnostics) — off in production unless explicitly enabled. */

function parseEnvTrue(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
}

function readAllowFlag(): boolean {
  return (
    parseEnvTrue(process.env.NEXT_PUBLIC_ALLOW_INTERNAL_OPS) ||
    parseEnvTrue(process.env.VITE_ALLOW_INTERNAL_OPS)
  );
}

export function isInternalOpsAllowed(): boolean {
  if (readAllowFlag()) return true;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
  }
  return false;
}
