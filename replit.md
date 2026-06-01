# PDFTrusted

A production-ready PDF SaaS with 100% client-side processing. All PDF operations happen in the browser — no file uploads, no privacy risk.

## Run & Operate

- `pnpm --filter @workspace/pdftrusted run dev` — run the frontend dev server
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v4, Framer Motion, Wouter (routing)
- PDF processing: pdf-lib (create/merge/edit PDFs), pdfjs-dist (render thumbnails, extract text)
- Icons: Lucide React
- UI components: Shadcn/ui (Radix UI based)

## Where things live

- `artifacts/pdftrusted/src/App.tsx` — main routing
- `artifacts/pdftrusted/src/pages/Home.tsx` — home page with hero + tool grid
- `artifacts/pdftrusted/src/pages/Download.tsx` — download page with AdSense slots
- `artifacts/pdftrusted/src/pages/tools/` — one file per tool
- `artifacts/pdftrusted/src/tools/[tool]/logic.ts` — isolated PDF processing logic per tool
- `artifacts/pdftrusted/src/tools/[tool]/content.ts` — SEO metadata, steps, FAQs per tool
- `artifacts/pdftrusted/src/components/AdSlot.tsx` — global AdSense component
- `artifacts/pdftrusted/src/components/DropZone.tsx` — drag-and-drop upload zone
- `artifacts/pdftrusted/src/components/PDFThumbnail.tsx` — pdfjs-dist thumbnail renderer
- `artifacts/pdftrusted/src/components/PremiumGate.tsx` — freemium gate overlay
- `artifacts/pdftrusted/src/context/ProcessContext.tsx` — stores processed file for download page
- `artifacts/pdftrusted/src/context/PremiumContext.tsx` — freemium limits (3 files, 10MB)
- `artifacts/pdftrusted/.env.example` — all environment variable slots (AdSense, Stripe, OpenAI, Gemini)

## Architecture decisions

- **100% client-side PDF processing**: pdf-lib handles merge/compress/split/watermark/unlock. pdfjs-dist handles thumbnail rendering and text extraction. No server-side PDF logic.
- **Modular tool isolation**: Each tool has its own `logic.ts` (PDF processing) and `content.ts` (SEO/copy). Editing one tool cannot break another.
- **ProcessContext as file bus**: Processed PDFs are passed to the download page via React Context (not URL params or localStorage), keeping data in memory.
- **Wouter routing**: Lightweight client-side router with BASE_URL support for Replit's proxy environment.
- **AdSense loaded dynamically**: The AdSense script is injected by the AdSlot component to avoid broken HTML env var interpolation in dev.

## Product

PDFTrusted is a free online PDF tool suite:
- **Merge PDF** — combine multiple PDFs with drag-to-reorder thumbnails
- **Compress PDF** — 3 compression levels (Extreme, Recommended, Less)
- **Split PDF** — visual page picker to extract specific pages
- **PDF to Word** — text extraction to RTF (Word-compatible)
- **Unlock PDF** — remove password protection and restrictions
- **Add Watermark** — custom text watermark with opacity/color/size controls
- **Download Page** — post-processing page with AdSense slots and privacy delete option

## User preferences

- Apple-style design: white backgrounds, rounded-3xl corners, soft shadows, Inter font
- Blue primary color (#007AFF = Apple blue)
- Privacy-first messaging: emphasize browser-only processing everywhere

## Gotchas

- pdfjs worker: `renderAllPages` lazy-loads pdfjs-dist to avoid blocking the main bundle
- AdSense: Set `VITE_ADSENSE_CLIENT_ID` in `.env.local` with your publisher ID
- Freemium limits: Free = 3 files max, 10MB max. Defined in `PremiumContext.tsx`
- Compression: pdf-lib doesn't do image compression — the "compress" tool optimizes PDF structure. For deep image compression, a server-side approach (Premium) would be needed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
