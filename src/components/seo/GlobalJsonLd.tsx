/**
 * Site-wide JSON-LD is injected in src/app/[locale]/[[...path]]/page.tsx (SSR scripts).
 * This client component is intentionally empty to avoid duplicate graphs in the SPA shell.
 */
export function GlobalJsonLd(_props: { lang?: string }) {
  return null;
}
