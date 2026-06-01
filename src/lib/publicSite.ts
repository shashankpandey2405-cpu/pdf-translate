import { SITE_URL } from "@/lib/seo/site";

/**
 * Public marketing origin (canonical links, QR codes, OAuth callbacks).
 * Set `NEXT_PUBLIC_SITE_URL` on Vercel to override (e.g. preview: https://xxx.vercel.app).
 */
export function getPublicSiteOrigin(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.trim()) || SITE_URL;
  return raw.replace(/\/$/, "");
}
