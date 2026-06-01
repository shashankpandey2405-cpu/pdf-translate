export {};

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }

  interface ImportMetaEnv {
    readonly DEV?: boolean;
    readonly VITE_SENTRY_DSN?: string;
    readonly VITE_GA_MEASUREMENT_ID?: string;
    readonly VITE_APP_RELEASE?: string;
    readonly VITE_SENTRY_TUNNEL?: string;
    readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
    readonly VITE_STRIPE_PUBLIC_KEY?: string;
    readonly VITE_PAYMENTS_ENABLED?: string;
    readonly VITE_PAYPAL_CLIENT_ID?: string;
    readonly VITE_AUTH_ONLY_MODE?: string;
    readonly VITE_MOCK_PREMIUM?: string;
    readonly VITE_API_PROXY_TARGET?: string;
    /** When true, shows Login / pricing CTAs. Omit or false = public free-suite UX (default). */
    readonly VITE_SHOW_AUTH_PREMIUM_UI?: string;
    /** When true, shows Sign in / Sign out and loads session (no premium marketing required). */
    readonly VITE_AUTH_ENABLED?: string;
    /** Set to load AdSense; omit in dev to keep layout placeholders without third-party script. */
    readonly VITE_ADSENSE_CLIENT_ID?: string;
    readonly VITE_ADSENSE_SLOT_TOP?: string;
    readonly VITE_ADSENSE_SLOT_SIDEBAR?: string;
    readonly VITE_ADSENSE_SLOT_BOTTOM?: string;
    readonly VITE_ADSENSE_SLOT_IN_ARTICLE?: string;
  }
}
