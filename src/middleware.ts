import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { resolveCanonicalToolPath } from "@/lib/seo/localeSlugAliases";
import { SEO_PUBLIC_PATH_HEADER } from "@/lib/seo/seoPath";
import { shouldBlockApiRequest } from "@/server/security/botGuard";

const LOCALES = new Set(["en", "hi", "zh", "ar", "es", "fr", "de"]);

function collapseDuplicateLocale(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  if (!LOCALES.has(parts[0]!) || parts[0] !== parts[1]) return null;
  const rest = parts.slice(2).join("/");
  return rest ? `/${parts[0]}/${rest}` : `/${parts[0]}`;
}

const LEGACY_ALIASES: Record<string, string> = {
  "/compress-images": "/compress-pdf",
  "/fill-pdf": "/pdf-editor",
  "/enhance-image": "/photo-resizer",
  "/merge-images": "/merge-pdf",
  "/edit-pdf": "/pdf-editor",
  "/ai-scanner": "/tools/ai-scanner",
  "/remove-watermark": "/magic-eraser",
  "/epub-to-pdf": "/word-to-pdf",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/favicon.ico") {
    return NextResponse.redirect(new URL("/icon-192.png", request.url), 308);
  }

  if (pathname.startsWith("/api")) {
    const ua = request.headers.get("user-agent") ?? "";
    if (shouldBlockApiRequest(pathname, ua)) {
      return NextResponse.json(
        { error: "forbidden", message: "Automated access to this API is not allowed." },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/auth")) {
    return updateSupabaseSession(request);
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  if (lastSegment.includes(".") && lastSegment !== ".") {
    return updateSupabaseSession(request);
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return NextResponse.redirect(new URL("/en", request.url), 308);
  }

  const locale = parts[0]!;

  const collapsed = collapseDuplicateLocale(pathname);
  if (collapsed) {
    const url = request.nextUrl.clone();
    url.pathname = collapsed;
    return NextResponse.redirect(url, 308);
  }

  if (!LOCALES.has(locale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en/${parts.join("/")}`;
    return NextResponse.redirect(url, 308);
  }

  const restPath = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";

  if (restPath.startsWith("/internal") || restPath === "/internal-tool-suite") {
    const allowInternal =
      process.env.NEXT_PUBLIC_ALLOW_INTERNAL_OPS === "true" ||
      process.env.VITE_ALLOW_INTERNAL_OPS === "true";
    const host = request.nextUrl.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!allowInternal && !isLocal) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      return NextResponse.redirect(url, 302);
    }
  }

  const aliasTarget = LEGACY_ALIASES[restPath];
  if (aliasTarget) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${aliasTarget}`;
    return NextResponse.redirect(url, 308);
  }

  const pathAfterLocale = parts.slice(1).join("/");
  const localeCanonical = pathAfterLocale
    ? resolveCanonicalToolPath(locale, pathAfterLocale)
    : null;
  if (localeCanonical && localeCanonical !== pathAfterLocale) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/${locale}/${localeCanonical}`;
    const sessionResponse = await updateSupabaseSession(request);
    const response = NextResponse.rewrite(rewriteUrl);
    sessionResponse.cookies.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value);
    });
    response.headers.set(SEO_PUBLIC_PATH_HEADER, restPath ? `/${pathAfterLocale}` : "/");
    if (restPath.startsWith("/internal")) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return response;
  }

  const response = await updateSupabaseSession(request);
  if (restPath.startsWith("/internal")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
