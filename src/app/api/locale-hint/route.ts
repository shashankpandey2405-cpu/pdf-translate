import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COUNTRY_TO_LANGUAGE: Record<string, "ar" | "hi" | "fr" | "es" | "zh" | "en"> = {
  AE: "ar",
  SA: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  EG: "ar",
  MA: "ar",
  TN: "ar",
  DZ: "ar",
  IN: "hi",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  FR: "fr",
  BE: "fr",
  CH: "fr",
  CA: "fr",
  CN: "zh",
  TW: "zh",
  SG: "zh",
};

export async function GET(request: NextRequest) {
  const country = (request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "")
    .trim()
    .toUpperCase();
  const suggestedLanguage = COUNTRY_TO_LANGUAGE[country] ?? "en";
  return Response.json({ country: country || "unknown", suggestedLanguage });
}
