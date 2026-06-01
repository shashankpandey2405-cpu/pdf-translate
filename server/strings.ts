export function val(v: string | undefined): string | undefined {
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function envFlagTrue(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1";
}

export function envFlagFalse(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "false" || s === "0";
}
