import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Inter } from "next/font/google";
import "@/index.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  weight: ["400", "600"],
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#312e81" },
  ],
};

const googleVerification =
  (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION as string | undefined)?.trim() ||
  (process.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined)?.trim() ||
  "";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pdftrusted.com"),
  title: "PDFTrusted — Secure Online PDF Tools | Browser + Cloud Hybrid Platform",
  description:
    "Free secure PDF tools online: merge, compress, convert, OCR, and AI workflows. Browser-first privacy for everyday tasks; Turbo Cloud for large files and heavy processing. Works on iPhone, Android, and desktop.",
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  keywords: [
    "AI PDF tools",
    "PDF compressor online",
    "PDF OCR AI",
    "PDF translator",
    "chat with PDF AI",
    "AI document intelligence",
    "merge pdf online free",
    "compress pdf",
    "pdf to word",
    "sign pdf online",
    "ilovepdf alternative",
    "smallpdf alternative",
    "pdf editor online",
    "AI summarize PDF",
    "smart scan AI",
    "best AI PDF tools USA",
    "PDF tools UAE",
    "free PDF tools online",
    "AI PDF tools for students",
    "PDF compressor USA",
    "enterprise document AI UAE",
    "compress PDF without losing quality",
    "AI document automation tools",
    "PDF tools Dubai",
    "free PDF tools India",
    "PDF tools UK",
    "PDF tools Canada",
  ],
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.pdftrusted.com",
    siteName: "PDFTrusted",
    title: "PDFTrusted — AI-Powered PDF Intelligence Platform",
    description:
      "Compress, translate, OCR, summarize, and chat with PDFs using advanced AI. 30+ tools, enterprise security, no sign-up needed.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "PDFTrusted — AI Document Intelligence Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFTrusted — AI-Powered PDF Intelligence Platform",
    description:
      "Compress, translate, OCR, summarize, and chat with PDFs using advanced AI. 30+ tools, enterprise security, no sign-up needed.",
    images: ["/icon-512.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `lang` is fixed in server HTML for accessibility audits — do not set via client scripts.
    <html lang="en" dir="ltr" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="google" content="notranslate" />
        <meta name="apple-mobile-web-app-title" content="PDFTrusted" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <Script id="theme-init" strategy="afterInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`}
        </Script>
      </head>
      <body
        className={`${inter.className} min-h-[100dvh] w-full overflow-x-clip antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
