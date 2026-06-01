import path from "path";
import { fileURLToPath } from "url";
import { withSentryConfig } from "@sentry/nextjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeStub = path.join(__dirname, "src/shims/node-stub.cjs");
const analyze = process.env.ANALYZE === "true";

if (
  process.env.VERCEL_ENV === "production" &&
  (process.env.PDFTRUSTED_QA_MODE === "true" || process.env.PDFTRUSTED_QA_MODE === "1")
) {
  throw new Error(
    "PDFTRUSTED_QA_MODE must not be enabled in production. Remove it from Vercel environment variables.",
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  staticPageGenerationTimeout: 120,
  transpilePackages: ["mupdf", "react-signature-canvas"],
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias["@/pages"] = path.join(__dirname, "src/route-pages");
    config.resolve.alias["@"] = path.join(__dirname, "src");
    config.resolve.alias["trim-canvas"] = path.join(__dirname, "src/shims/trim-canvas.cjs");
    config.experiments = { ...(config.experiments || {}), topLevelAwait: true };

    if (!isServer) {
      config.output.environment = {
        ...(config.output.environment || {}),
        asyncFunction: true,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:fs$/, nodeStub),
        new webpack.NormalModuleReplacementPlugin(/^node:path$/, nodeStub),
        new webpack.NormalModuleReplacementPlugin(/^node:module$/, nodeStub),
      );
      config.resolve.alias.fs = nodeStub;
      config.resolve.alias.path = nodeStub;
      config.resolve.alias.crypto = nodeStub;
      config.resolve.alias.module = nodeStub;
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
        module: false,
      };

      // Phase 1: isolate heavy PDF/WASM vendors into async chunks (tool routes load on demand).
      config.optimization = {
        ...(config.optimization || {}),
        splitChunks: {
          ...(config.optimization?.splitChunks || {}),
          cacheGroups: {
            ...(config.optimization?.splitChunks?.cacheGroups || {}),
            pdfjs: {
              test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
              name: "vendor-pdfjs",
              chunks: "async",
              priority: 40,
              reuseExistingChunk: true,
            },
            pdfLib: {
              test: /[\\/]node_modules[\\/]pdf-lib[\\/]/,
              name: "vendor-pdf-lib",
              chunks: "async",
              priority: 39,
              reuseExistingChunk: true,
            },
            fabric: {
              test: /[\\/]node_modules[\\/]fabric[\\/]/,
              name: "vendor-fabric",
              chunks: "async",
              priority: 38,
              reuseExistingChunk: true,
            },
            mupdf: {
              test: /[\\/]node_modules[\\/]mupdf[\\/]/,
              name: "vendor-mupdf",
              chunks: "async",
              priority: 37,
              reuseExistingChunk: true,
            },
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: "vendor-framer-motion",
              chunks: "async",
              priority: 33,
              reuseExistingChunk: true,
            },
            opencv: {
              test: /[\\/]node_modules[\\/]@techstark[\\/]opencv-js[\\/]/,
              name: "vendor-opencv",
              chunks: "async",
              priority: 36,
              reuseExistingChunk: true,
            },
            tesseract: {
              test: /[\\/]node_modules[\\/]tesseract\.js[\\/]/,
              name: "vendor-tesseract",
              chunks: "async",
              priority: 35,
              reuseExistingChunk: true,
            },
            xlsx: {
              test: /[\\/]node_modules[\\/]xlsx[\\/]/,
              name: "vendor-xlsx",
              chunks: "async",
              priority: 34,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },  /** Inline client-visible vars (maps NEXT_PUBLIC_* from Vercel → legacy VITE_* names used in src). */
  env: {
    VITE_PDF_ENGINE: process.env.NEXT_PUBLIC_PDF_ENGINE || "",
    VITE_SHOW_AUTH_PREMIUM_UI: process.env.NEXT_PUBLIC_SHOW_AUTH_PREMIUM_UI || "",
    VITE_AUTH_ENABLED: process.env.NEXT_PUBLIC_AUTH_ENABLED || "",
    VITE_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    VITE_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    VITE_AUTH_ONLY_MODE: process.env.NEXT_PUBLIC_AUTH_ONLY_MODE || "",
    VITE_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    VITE_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
    VITE_ADSENSE_SLOT_TOP: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP || "",
    VITE_ADSENSE_SLOT_SIDEBAR: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || "",
    VITE_ADSENSE_SLOT_BOTTOM: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM || "",
    VITE_ADSENSE_SLOT_IN_ARTICLE: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE || "",
    VITE_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "",
    VITE_PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED || "",
    VITE_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    NEXT_PUBLIC_PAYMENTS_ENABLED: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED || "",
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    VITE_MOCK_PREMIUM: process.env.NEXT_PUBLIC_MOCK_PREMIUM || "",
    VITE_ENHANCED_ENABLED: process.env.NEXT_PUBLIC_ENHANCED_ENABLED || "",
    NEXT_PUBLIC_ENHANCED_ENABLED: process.env.NEXT_PUBLIC_ENHANCED_ENABLED || "",
    VITE_PDFTRUSTED_QA_MODE: process.env.NEXT_PUBLIC_PDFTRUSTED_QA_MODE || "",
    VITE_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    VITE_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
    VITE_APP_RELEASE:
      process.env.NEXT_PUBLIC_APP_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || "",
    NEXT_PUBLIC_APP_RELEASE:
      process.env.NEXT_PUBLIC_APP_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || "20260515.1",
    VITE_SENTRY_TUNNEL: process.env.NEXT_PUBLIC_SENTRY_TUNNEL || "",
    NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED: "0",
  },
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@auth/core",
  ],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-accordion",
      "framer-motion",
      "pdfjs-dist",
      "fabric",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async redirects() {
    return [];
  },
  async headers() {
    const immutable = "public, max-age=31536000, immutable";
    const staticDay = "public, max-age=86400, stale-while-revalidate=604800";
    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/logo.png", headers: [{ key: "Cache-Control", value: immutable }] },
      { source: "/logo-96.png", headers: [{ key: "Cache-Control", value: immutable }] },
      { source: "/logo-192.png", headers: [{ key: "Cache-Control", value: immutable }] },
      { source: "/favicon.ico", headers: [{ key: "Cache-Control", value: immutable }] },
      { source: "/pdf.worker.min.mjs", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/sitemap.xml", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/manifest.webmanifest", headers: [{ key: "Cache-Control", value: staticDay }] },
      {
        source: "/:locale(en|hi|zh|ar|es|fr|de)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:locale(en|hi|zh|ar|es|fr|de)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      { source: "/:path*.png", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/:path*.jpg", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/:path*.jpeg", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/:path*.webp", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/:path*.svg", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/:path*.ico", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/:path*.woff2", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/:path*.mjs", headers: [{ key: "Cache-Control", value: staticDay }] },
      { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: immutable }] },
    ];
  },
};

const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: process.env.NODE_ENV === "production",
  automaticVercelMonitors: true,
};

let resolvedConfig = nextConfig;

if (analyze) {
  try {
    const withBundleAnalyzer = (await import("@next/bundle-analyzer")).default;
    resolvedConfig = withBundleAnalyzer({ enabled: true })(nextConfig);
  } catch {
    console.warn("ANALYZE=true but @next/bundle-analyzer not installed — skipping.");
  }
}

export default process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(resolvedConfig, sentryBuildOptions)
  : resolvedConfig;
