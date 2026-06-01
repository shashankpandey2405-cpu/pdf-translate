import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  function resolveApiProxyTarget(raw: string | undefined): string {
    const trimmed = (raw ?? "").trim();
    if (trimmed === "-") return "";
    const fallback = mode === "development" ? "http://127.0.0.1:3001" : "";
    const candidate = trimmed || fallback;
    if (!candidate) return "";
    try {
      const u = new URL(candidate);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      return candidate;
    } catch {
      if (mode === "development") {
        // eslint-disable-next-line no-console
        console.warn("[vite] Invalid VITE_API_PROXY_TARGET — /api proxy disabled.");
      }
      return "";
    }
  }

  /**
   * `/api` proxy target for `vite dev`. Empty value in development defaults to the
   * local Worker (`wrangler dev` on port 3001 — see npm run dev:full).
   * Set VITE_API_PROXY_TARGET to "-" to disable the proxy entirely, or to a remote
   * origin (e.g. https://www.pdftrusted.com) to hit the deployed API instead.
   * NOTE: Google OAuth callbacks (http://localhost:3000/api/auth/callback/google)
   * only resolve correctly when the proxy points at a running Worker that knows the
   * Auth.js secrets.
   */
  const apiProxyTarget = resolveApiProxyTarget(env.VITE_API_PROXY_TARGET);
  if (mode === "development") {
    // eslint-disable-next-line no-console
    console.info(`[vite] /api proxy target: ${apiProxyTarget || "(disabled)"}`);
  }

  const apiProxy: Record<string, string | ProxyOptions> | undefined = apiProxyTarget
    ? {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      }
    : undefined;

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["logo.png", "robots.txt", "sitemap.xml", "ads.txt", "offline.html"],
        manifest: {
          id: "/",
          name: "PDFTrusted — AI PDF Tools",
          short_name: "PDFTrusted",
          description:
            "30+ AI-powered PDF tools: merge, compress, OCR, translate, summarize. Browser-first privacy, no sign-up needed.",
          theme_color: "#0b1220",
          background_color: "#0b1220",
          display: "standalone",
          display_override: ["standalone"],
          orientation: "any",
          scope: "/",
          start_url: "/?utm_source=pwa",
          lang: "en",
          dir: "ltr",
          categories: ["utilities", "productivity", "business"],
          prefer_related_applications: false,
          launch_handler: { client_mode: "navigate-existing" },
          icons: [
            { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          screenshots: [
            {
              src: "/logo.png",
              sizes: "512x512",
              type: "image/png",
              form_factor: "narrow",
              label: "PDFTrusted — AI-powered PDF tools in your browser",
            },
            {
              src: "/logo.png",
              sizes: "512x512",
              type: "image/png",
              form_factor: "wide",
              label: "PDFTrusted — Merge, compress, convert PDFs securely",
            },
          ],
          shortcuts: [
            {
              name: "Merge PDF",
              short_name: "Merge",
              description: "Combine multiple PDFs into one",
              url: "/en/merge-pdf?utm_source=pwa_shortcut",
              icons: [{ src: "/logo.png", sizes: "192x192" }],
            },
            {
              name: "Compress PDF",
              short_name: "Compress",
              description: "Reduce PDF file size",
              url: "/en/compress-pdf?utm_source=pwa_shortcut",
              icons: [{ src: "/logo.png", sizes: "192x192" }],
            },
            {
              name: "PDF to Word",
              short_name: "To Word",
              description: "Convert PDF to editable Word document",
              url: "/en/pdf-to-word?utm_source=pwa_shortcut",
              icons: [{ src: "/logo.png", sizes: "192x192" }],
            },
            {
              name: "PDF Editor",
              short_name: "Editor",
              description: "Edit PDF text, images, and annotations",
              url: "/en/pdf-editor?utm_source=pwa_shortcut",
              icons: [{ src: "/logo.png", sizes: "192x192" }],
            },
          ],
        },
        workbox: {
          cacheId: "pdftrusted-sw-v4",
          globPatterns: ["**/*.{js,css,html,png,svg,json,mjs,woff2}"],
          globIgnores: ["**/opencv*.js"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//, /\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2|pdf)$/i],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          additionalManifestEntries: [{ url: "/offline.html", revision: "v4" }],
          runtimeCaching: [
            {
              urlPattern:
                /\/(en|hi|zh|ar|es|fr|de)\/(merge-pdf|compress-pdf|split-pdf|pdf-to-word|pdf-editor|pdf-to-png|pdf-to-jpg|generate-qr-code|tools\/ai-scanner|all-tools)/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "pdftrusted-tool-pages-v4",
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "pdftrusted-google-fonts-stylesheets",
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "pdftrusted-google-fonts-webfonts",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico)$/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "pdftrusted-images-v4",
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    /** mupdf uses top-level await; default es2020 targets reject it during dep pre-bundle / production build */
    esbuild: {
      target: "es2022",
      supported: {
        "top-level-await": true,
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2022",
        supported: {
          "top-level-await": true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "esbuild",
      target: "es2022",
    },
    server: {
      port: 3000,
      host: true,
      proxy: apiProxy,
    },
  };
});