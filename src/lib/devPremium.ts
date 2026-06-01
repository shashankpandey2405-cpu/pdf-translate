/** Local dev helpers (replaces removed paymentsConfig). */

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env[key]) return process.env[key];
  try {
    return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
  } catch {
    return undefined;
  }
}

export function mockPremiumEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && (readEnv("VITE_MOCK_PREMIUM") ?? "").trim() === "true";
}
