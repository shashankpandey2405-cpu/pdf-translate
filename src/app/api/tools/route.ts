export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Featured PDF tools — processing runs in the browser; all uploads use these Vercel `/api/*` routes. */
const CORE_TOOLS = [
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
  "pdf-to-word",
  "word-to-pdf",
  "pdf-to-excel",
  "excel-to-pdf",
  "pdf-to-image",
  "pdf-to-png",
  "pdf-to-jpg",
  "pdf-to-epub",
  "pdf-editor",
  "unlock-pdf",
  "sign-pdf",
];

export async function GET() {
  let allSlugs: string[] = CORE_TOOLS;
  try {
    const mod = (await import("../../../../constants/tools.js")) as {
      TOOL_SLUGS?: string[];
    };
    if (Array.isArray(mod.TOOL_SLUGS) && mod.TOOL_SLUGS.length) {
      allSlugs = mod.TOOL_SLUGS;
    }
  } catch {
    /* use CORE_TOOLS */
  }

  return Response.json({
    executionMode: "browser",
    /** Heavy PDF work stays in the browser to honor Vercel Hobby timeouts/bandwidth; R2 APIs exist only for large-file staging. */
    architecture:
      "Client-side pdf-lib + pdf.js/fabric render pipelines with tiered Cloudflare R2 uploads (/api/r2/* + multipart). Processing endpoints intentionally omit heavy CPU routes.",
    apis: {
      presignPut: "/api/r2/presign-put",
      deleteStaged: "/api/r2/delete-staged",
      multipartInit: "/api/multipart/init",
      multipartSignPart: "/api/multipart/sign-part",
      multipartComplete: "/api/multipart/complete",
      multipartAbort: "/api/multipart/abort",
      session: "/api/session",
      auth: "/api/auth",
    },
    tools: allSlugs.map((slug) => ({
      slug,
      processClientSide: true,
    })),
  });
}
