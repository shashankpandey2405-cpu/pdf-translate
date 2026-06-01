/**
 * /api/locale-hint — returns a suggested UI language based on the visitor's
 * Cloudflare-detected country (`cf-ipcountry`). The SPA uses this on first load.
 */

import { Hono } from "hono";
import type { Env } from "../env";

const COUNTRY_TO_LANGUAGE: Record<string, "ar" | "hi" | "fr" | "es" | "zh" | "en"> = {
  AE: "ar", SA: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar",
  EG: "ar", MA: "ar", TN: "ar", DZ: "ar",
  IN: "hi",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es",
  FR: "fr", BE: "fr", CH: "fr", CA: "fr",
  CN: "zh", TW: "zh", SG: "zh",
};

const app = new Hono<{ Bindings: Env }>();

app.get("/locale-hint", (c) => {
  const country = (c.req.header("cf-ipcountry") ?? "").trim().toUpperCase();
  const suggestedLanguage = COUNTRY_TO_LANGUAGE[country] ?? "en";
  return c.json({ country: country || "unknown", suggestedLanguage });
});

export default app;
