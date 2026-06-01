/** Dev-only debug logging. No-op in production builds. */

function isAgentLogEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function agentLog(
  _location: string,
  _message: string,
  _data: Record<string, unknown>,
  _hypothesisId: string,
  _runId = "pre-fix",
): void {
  if (!isAgentLogEnabled()) return;
  // Intentionally empty in production — previous debug ingest removed to avoid CSP noise.
}
