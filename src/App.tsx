"use client";

import "@/lib/wouterDeferredHistory";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProcessProvider } from "@/context/ProcessContext";
import { WorkspaceHistoryProvider } from "@/context/WorkspaceHistoryContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { PwaInstallProvider } from "@/context/PwaInstallContext";
import { TrustShieldProvider } from "@/context/TrustShieldContext";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { Helmet } from "react-helmet-async";
import { isDesktopToolRoute } from "@/lib/desktop/isDesktopToolRoute";
import { SMART_SCAN_SEO_ALIASES } from "@/lib/ai/smartScanLimits";
import { AuthSessionSync } from "@/components/auth/AuthSessionSync";
import { GlobalJsonLd } from "@/components/seo/GlobalJsonLd";
import { PwaInstallBanner } from "@/components/PwaInstallBanner";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { ExitIntentPrompt } from "@/components/ExitIntentPrompt";
import { GuestIdleToolNudge } from "@/components/conversion/GuestIdleToolNudge";
import { ReturningGuestBanner } from "@/components/conversion/ReturningGuestBanner";
import { ConversionVisitTracker } from "@/components/conversion/ConversionVisitTracker";
import { PostSignupWelcomeModal } from "@/components/conversion/PostSignupWelcomeModal";
import { PostSuccessFeedbackModal } from "@/components/feedback/PostSuccessFeedbackModal";
import { ShareAfterDownloadNudge } from "@/components/conversion/ShareAfterDownloadNudge";
import { OverlayPriorityProvider } from "@/context/OverlayPriorityContext";
import ScrollToTop from "@/components/ScrollToTop";
import { MonitoringRouteListener } from "@/components/MonitoringRouteListener";
import { useVisualViewportKeyboardInset } from "@/hooks/useVisualViewportKeyboardInset";
import { useSyncedWouterPath } from "@/hooks/useSyncedWouterPath";
import { deferredReplaceState } from "@/lib/deferredHistory";
import { cn } from "@/lib/utils";
import { flushRegisteredStagedKeysSyncBestEffort } from "@/lib/stagedFileRegistry";
import { getOrCreateGuestSessionId } from "@/lib/guestSession";
import { CommandPaletteProvider } from "@/context/CommandPaletteContext";
import { PremiumUpsellProvider } from "@/context/PremiumUpsellContext";
import { ToolRightSlideProvider } from "@/context/ToolRightSlideContext";
import { PremiumSlidePanel } from "@/components/desktop/PremiumSlidePanel";
import { ToolRightSlidePanel } from "@/components/desktop/ToolRightSlidePanel";
import { AuthPromptProvider } from "@/context/AuthPromptContext";
import { ProcessingModeProvider } from "@/context/ProcessingModeContext";
import { ProcessingMonitorProvider } from "@/context/ProcessingMonitorContext";
import { DeviceOptimizedBanner } from "@/components/device/DeviceOptimizedBanner";
import { PageTransition } from "@/components/layout/PageTransition";
import { SsrHomeHeroSync } from "@/components/layout/SsrHomeHeroSync";
import { pathWithoutSearchHash } from "@/lib/appPaths";
import { DeferAfterIdle } from "@/components/layout/DeferAfterIdle";
import { RouteFallback } from "@/components/layout/RouteFallback";
import { RecentToolsTracker } from "@/components/layout/RecentToolsTracker";
import { useDeferredIdleReady } from "@/hooks/useDeferredIdleReady";
import { PwaSplashScreen } from "@/components/pwa/PwaSplashScreen";
import "@/i18n";
import i18n, { changeAppLanguage, ensureI18nLanguage, type SupportedLanguage } from "@/i18n";
import {
  DEFAULT_LANGUAGE,
  detectBrowserLanguage,
  detectGeoLanguage,
  getPathLanguage,
  getStoredLanguage,
  setStoredLanguage,
} from "@/lib/localization";
import type { LocaleCode } from "@/lib/seo/site";

const Navbar = lazy(() => import("@/components/Navbar"));
const MobileToolChromeHeader = lazy(() =>
  import("@/components/mobile/MobileToolChromeHeader").then((mod) => ({
    default: mod.MobileToolChromeHeader,
  })),
);
const Footer = lazy(() => import("@/components/Footer"));
const MobileBottomNav = lazy(() => import("@/components/MobileBottomNav"));
const Home = lazy(() => import("@/pages/Home"));

const CommandPalette = lazy(() =>
  import("@/components/command/CommandPalette").then((mod) => ({ default: mod.CommandPalette })),
);

const DesktopTopNav = lazy(() =>
  import("@/components/desktop/DesktopTopNav").then((mod) => ({ default: mod.DesktopTopNav })),
);

const AllTools = lazy(() => import("@/pages/AllTools"));
const Download = lazy(() => import("@/pages/Download"));
const GetApp = lazy(() => import("@/pages/GetApp"));
const Login = lazy(() => import("@/pages/Login"));
const Account = lazy(() => import("@/pages/Account"));
const RecentActivity = lazy(() => import("@/pages/RecentActivity"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const ContactUs = lazy(() => import("@/pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const MergePDF = lazy(() => import("@/pages/tools/MergePDF"));
const CompressPDF = lazy(() => import("@/pages/tools/CompressPDF"));
const ConverterHub = lazy(() => import("@/route-pages/tools/ConverterHub"));
const SplitPDF = lazy(() => import("@/pages/tools/SplitPDF"));
const ExtractPages = lazy(() => import("@/pages/tools/ExtractPages"));
const RemovePages = lazy(() => import("@/pages/tools/RemovePages"));
const OrganizePdf = lazy(() => import("@/pages/tools/OrganizePdf"));
const PDFToWord = lazy(() => import("@/pages/tools/PDFToWord"));
const WordToPdf = lazy(() => import("@/pages/tools/WordToPdf"));
const UnlockPDF = lazy(() => import("@/pages/tools/UnlockPDF"));
const ProtectPdf = lazy(() => import("@/pages/tools/ProtectPdf"));
const HardLockPdf = lazy(() => import("@/pages/tools/HardLockPdf"));
const RepairPdf = lazy(() => import("@/pages/tools/RepairPdf"));
const RedactPdf = lazy(() => import("@/pages/tools/RedactPdf"));
const OcrPdf = lazy(() => import("@/pages/tools/OcrPdf"));
const PdfToHtml = lazy(() => import("@/pages/tools/PdfToHtml"));
const WatermarkPDF = lazy(() => import("@/pages/tools/WatermarkPDF"));
const RotatePDF = lazy(() => import("@/pages/tools/RotatePDF"));
const PDFToImage = lazy(() => import("@/pages/tools/PDFToImage"));
const PageNumbers = lazy(() => import("@/pages/tools/PageNumbers"));
const PDFEditor = lazy(() => import("@/pages/tools/PDFEditor"));
const SignPdf = lazy(() => import("@/pages/tools/SignPdf"));
const UniversalConverter = lazy(() => import("@/pages/tools/UniversalConverter"));
const DocumentScanner = lazy(() => import("@/pages/tools/DocumentScanner"));
const PhotoResizer = lazy(() => import("@/pages/tools/PhotoResizer"));
const ResumeBuilder = lazy(() => import("@/pages/tools/ResumeBuilder"));
const PDFMaker = lazy(() => import("@/pages/tools/PDFMaker"));
const ToolOrDedicatedPage = lazy(() => import("@/components/tools/ToolOrDedicatedPage"));
const InternalToolSuite = lazy(() => import("@/pages/internal/InternalToolSuite"));
const EnhancedOps = lazy(() => import("@/pages/internal/EnhancedOps"));
const CloudPipelineDiagnostics = lazy(() => import("@/pages/internal/CloudPipelineDiagnostics"));
const CloudToolSmokeTest = lazy(() => import("@/pages/internal/CloudToolSmokeTest"));
const GenerateQRCode = lazy(() => import("@/pages/tools/GenerateQRCode"));
const AiScanner = lazy(() => import("@/pages/tools/AiScanner"));
const TranslatePDF = lazy(() => import("@/pages/tools/TranslatePDF"));
const AiSummarizePDF = lazy(() => import("@/pages/tools/AiSummarizePDF"));
const ChatPdf = lazy(() => import("@/pages/tools/ChatPdf"));
const PdfToPdfa = lazy(() => import("@/pages/tools/PdfToPdfa"));
const SmartScanAi = lazy(() => import("@/pages/tools/SmartScanAi"));
const FlattenPdf = lazy(() => import("@/pages/tools/FlattenPdf"));
const ComparePdf = lazy(() => import("@/pages/tools/ComparePdf"));
const AiQuestionGenerator = lazy(() => import("@/pages/tools/AiQuestionGenerator"));
const WatermarkRemover = lazy(() => import("@/pages/tools/WatermarkRemover"));
const BlogIndex = lazy(() => import("@/pages/blog/BlogIndex"));
const BlogPost = lazy(() => import("@/pages/blog/BlogPost"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const Disclaimer = lazy(() => import("@/pages/Disclaimer"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const HowToUse = lazy(() => import("@/pages/HowToUse"));
const CompareHub = lazy(() => import("@/pages/compare/CompareHub"));
const ComparePage = lazy(() => import("@/pages/compare/ComparePage"));
const CompareSpeedPage = lazy(() => import("@/pages/compare/CompareSpeedPage"));
const PrivacyCenter = lazy(() => import("@/pages/PrivacyCenter"));
const Security = lazy(() => import("@/pages/Security"));
const HelpCenterHub = lazy(() => import("@/route-pages/help/HelpCenterHub"));
const HelpTopicPage = lazy(() => import("@/route-pages/help/HelpTopicPage"));
const GuidesIndex = lazy(() => import("@/route-pages/guides/GuidesIndex"));
const ToolGuidePage = lazy(() => import("@/route-pages/guides/ToolGuidePage"));
const ToolFaqPage = lazy(() => import("@/route-pages/faq/ToolFaqPage"));
const LearnIndex = lazy(() => import("@/route-pages/learn/LearnIndex"));
const LearnArticlePage = lazy(() => import("@/route-pages/learn/LearnArticlePage"));

function GuestSessionInit() {
  const ready = useDeferredIdleReady({ timeout: 4000 });
  useEffect(() => {
    if (ready) void getOrCreateGuestSessionId();
  }, [ready]);
  if (!ready) return null;
  return <ConversionVisitTracker />;
}

function StagedKeysLifecycle() {
  useEffect(() => {
    const onBeforeUnload = () => flushRegisteredStagedKeysSyncBestEffort();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushRegisteredStagedKeysSyncBestEffort();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}

const queryClient = new QueryClient();
const googleSiteVerification = (process.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined)?.trim() || "";

function Router({ uiLang }: { uiLang: LocaleCode }) {
  const [wouterLocation] = useLocation();
  const routerBase = `/${uiLang}`;
  const syncedPath = useSyncedWouterPath(routerBase);
  const activePath = syncedPath || wouterLocation;
  const routePath = pathWithoutSearchHash(activePath);
  const hydrated = useHydrated();
  useVisualViewportKeyboardInset();
  const isHomeRoute = routePath === "/" || routePath === "";
  const desktopToolChrome = isDesktopToolRoute(routePath);
  const reserveMobileDock =
    !isHomeRoute &&
    !desktopToolChrome &&
    !routePath.includes("internal-tool-suite") &&
    !routePath.includes("/pdf-editor") &&
    !routePath.includes("/sign-pdf");

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] w-full max-w-[100dvw] flex-col overflow-x-clip bg-background",
        reserveMobileDock && "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
      )}
    >
      {!isHomeRoute ? (
        <>
          {desktopToolChrome ? (
            <Suspense fallback={null}>
              <MobileToolChromeHeader />
            </Suspense>
          ) : (
            <div className="lg:hidden">
              <Suspense fallback={null}>
                <Navbar />
              </Suspense>
            </div>
          )}
          <Suspense fallback={null}>
            <DesktopTopNav />
          </Suspense>
        </>
      ) : null}
      <SsrHomeHeroSync isHomeRoute={isHomeRoute} />
      <AuthSessionSync />
      <DeferAfterIdle timeout={3000}>
        <MonitoringRouteListener />
        <RecentToolsTracker />
      </DeferAfterIdle>
      {!desktopToolChrome && !isHomeRoute && (
        <div className="app-shell pointer-events-none relative mx-auto w-full min-w-0 max-w-7xl px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6">
          <DeviceOptimizedBanner />
          <PwaInstallBanner />
          <CookieConsentBanner />
        </div>
      )}
      {!isHomeRoute ? (
        <DeferAfterIdle timeout={2000}>
          <ReturningGuestBanner />
        </DeferAfterIdle>
      ) : null}
      {hydrated && !isHomeRoute ? (
        <DeferAfterIdle timeout={3500}>
          <ExitIntentPrompt />
          <GuestIdleToolNudge />
          <ShareAfterDownloadNudge />
        </DeferAfterIdle>
      ) : null}
      <ScrollToTop />
      <DeferAfterIdle timeout={2500}>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </DeferAfterIdle>
      {googleSiteVerification ? (
        <Helmet>
          <meta name="google-site-verification" content={googleSiteVerification} />
        </Helmet>
      ) : null}
      <main
        id="main-content"
        className={cn(
          "flex-1 min-w-0 touch-pan-y overflow-x-clip overflow-y-visible mobile-scroll-contain pb-[max(env(safe-area-inset-bottom),var(--keyboard-inset,0px))]",
          desktopToolChrome && "lg:overflow-hidden lg:pb-0",
        )}
      >
        <GlobalJsonLd lang={uiLang} />
        <Suspense fallback={<RouteFallback isHome={isHomeRoute} />}>
          <PageTransition routeKey={routePath}>
          <Switch location={routePath}>
            <Route path="/" component={Home} />
            <Route path="/all-tools" component={AllTools} />
            <Route path="/download" component={Download} />
            <Route path="/get-app" component={GetApp} />
            <Route path="/pdf-maker" component={PDFMaker} />
            <Route path="/pdf-editor" component={PDFEditor} />
            <Route path="/edit-pdf">
              <Redirect to="/pdf-editor" />
            </Route>
            <Route path="/sign-pdf" component={SignPdf} />
            <Route path="/universal-converter" component={UniversalConverter} />
            <Route path="/document-scanner" component={DocumentScanner} />
            <Route path="/photo-resizer" component={PhotoResizer} />
            <Route path="/resume-builder" component={ResumeBuilder} />
            <Route path="/professional-cv-maker">
              <Redirect to="/resume-builder" />
            </Route>
            <Route path="/government-resume-builder">
              <Redirect to="/resume-builder?intent=government" />
            </Route>
            <Route path="/ats-friendly-resume-builder">
              <Redirect to="/resume-builder?intent=ats" />
            </Route>
            <Route path="/merge-pdf" component={MergePDF} />
            <Route path="/converter" component={ConverterHub} />
            <Route path="/compress-pdf" component={CompressPDF} />
            <Route path="/split-pdf" component={SplitPDF} />
            <Route path="/extract-pages" component={ExtractPages} />
            <Route path="/remove-pages" component={RemovePages} />
            <Route path="/organize-pdf" component={OrganizePdf} />
            <Route path="/pdf-to-word" component={PDFToWord} />
            <Route path="/word-to-pdf" component={WordToPdf} />
            <Route path="/unlock-pdf" component={UnlockPDF} />
            <Route path="/protect-pdf" component={ProtectPdf} />
            <Route path="/hard-lock-pdf" component={HardLockPdf} />
            <Route path="/repair-pdf" component={RepairPdf} />
            <Route path="/redact-pdf" component={RedactPdf} />
            <Route path="/ocr-pdf" component={OcrPdf} />
            <Route path="/pdf-to-html" component={PdfToHtml} />
            <Route path="/watermark-pdf" component={WatermarkPDF} />
            <Route path="/rotate-pdf" component={RotatePDF} />
            <Route path="/pdf-to-image" component={PDFToImage} />
            <Route path="/pdf-to-png" component={PDFToImage} />
            <Route path="/pdf-to-jpg" component={PDFToImage} />
            <Route path="/page-numbers" component={PageNumbers} />
            <Route path="/about-us" component={AboutUs} />
            <Route path="/privacy-center" component={PrivacyCenter} />
            <Route path="/security" component={Security} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/refund-policy" component={RefundPolicy} />
            <Route path="/cookie-policy" component={CookiePolicy} />
            <Route path="/disclaimer" component={Disclaimer} />
            <Route path="/faq/tools/:toolSlug" component={ToolFaqPage} />
            <Route path="/faq/:slug" component={ToolFaqPage} />
            <Route path="/faq" component={FAQ} />
            <Route path="/how-to-use" component={HowToUse} />
            <Route path="/help/:topic" component={HelpTopicPage} />
            <Route path="/help" component={HelpCenterHub} />
            <Route path="/guides/tools/:toolSlug" component={ToolGuidePage} />
            <Route path="/guides/:slug" component={ToolGuidePage} />
            <Route path="/guides" component={GuidesIndex} />
            <Route path="/learn/:topic" component={LearnArticlePage} />
            <Route path="/learn" component={LearnIndex} />
            <Route path="/compare" component={CompareHub} />
            <Route path="/compare/speed" component={CompareSpeedPage} />
            <Route path="/compare/:competitor" component={ComparePage} />
            <Route path="/contact" component={ContactUs} />
            <Route path="/login" component={Login} />
            <Route path="/account" component={Account} />
            <Route path="/recent" component={RecentActivity} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/generate-qr-code" component={GenerateQRCode} />
            <Route path="/tools/ai-scanner" component={AiScanner} />
            <Route path="/translate-pdf" component={TranslatePDF} />
            <Route path="/ai-summarize" component={AiSummarizePDF} />
            <Route path="/chat-pdf" component={ChatPdf} />
            <Route path="/pdf-to-pdfa" component={PdfToPdfa} />
            <Route path="/smart-scan-ai" component={SmartScanAi} />
            {SMART_SCAN_SEO_ALIASES.map((alias) => (
              <Route key={alias} path={`/${alias}`} component={SmartScanAi} />
            ))}
            <Route path="/flatten-pdf" component={FlattenPdf} />
            <Route path="/compare-pdf" component={ComparePdf} />
            <Route path="/ai-question-gen" component={AiQuestionGenerator} />
            <Route path="/magic-eraser" component={WatermarkRemover} />
            <Route path="/remove-watermark" component={WatermarkRemover} />
            <Route path="/ai-scanner">
              <Redirect to="/tools/ai-scanner" />
            </Route>
            <Route path="/ai-pdf-compressor">
              <Redirect to="/compress-pdf" />
            </Route>
            <Route path="/chat-with-pdf">
              <Redirect to="/chat-pdf" />
            </Route>
            <Route path="/pdf-ocr-ai">
              <Redirect to="/ocr-pdf" />
            </Route>
            <Route path="/pdf-translator">
              <Redirect to="/translate-pdf" />
            </Route>
            <Route path="/blog" component={BlogIndex} />
            <Route path="/blog/:slug" component={BlogPost} />
            <Route path="/internal-tool-suite" component={InternalToolSuite} />
            <Route path="/internal/enhanced-ops" component={EnhancedOps} />
            <Route path="/internal/cloud-pipeline" component={CloudPipelineDiagnostics} />
            <Route path="/internal/cloud-smoke" component={CloudToolSmokeTest} />
            <Route path="/:toolId" component={ToolOrDedicatedPage} />
            <Route>
              <div className="flex min-h-[60vh] items-center justify-center text-center">
                <div>
                  <p className="mb-4 text-8xl font-bold text-primary">404</p>
                  <h1 className="mb-2 text-2xl font-semibold text-foreground">{i18n.t("app.notFoundTitle")}</h1>
                  <p className="mb-6 text-muted-foreground">{i18n.t("app.notFoundDesc")}</p>
                  <a href={`/${uiLang}`} className="font-medium text-primary hover:underline">
                    {i18n.t("app.goHome")}
                  </a>
                </div>
              </div>
            </Route>
          </Switch>
          </PageTransition>
        </Suspense>
      </main>
      {!desktopToolChrome ? (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      ) : null}
      {!isHomeRoute && !desktopToolChrome ? (
        <Suspense fallback={null}>
          <MobileBottomNav />
        </Suspense>
      ) : null}
    </div>
  );
}

function App({
  initialLocale = DEFAULT_LANGUAGE,
  ssrPath = "/",
  ssrSearch = "",
}: {
  initialLocale?: LocaleCode;
  ssrPath?: string;
  ssrSearch?: string;
}) {
  const [language, setLanguage] = useState<LocaleCode>(initialLocale);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const run = async () => {
      const current = getPathLanguage(window.location.pathname);
      const stored = getStoredLanguage();
      const browser = detectBrowserLanguage();
      const geo = await detectGeoLanguage();
      const nextLanguage = stored || current || browser || geo || DEFAULT_LANGUAGE;
      const rawPath = window.location.pathname + window.location.search + window.location.hash;
      const pathWithoutLang = current
        ? rawPath.replace(new RegExp(`^/${current}`), "") || "/"
        : rawPath || "/";

      if (!current) {
        deferredReplaceState(
          `/${nextLanguage}${pathWithoutLang.startsWith("/") ? pathWithoutLang : `/${pathWithoutLang}`}`,
        );
      }

      if (cancelled) return;
      setStoredLanguage(nextLanguage);
      await ensureI18nLanguage(nextLanguage);
      await i18n.changeLanguage(nextLanguage);
      setLanguage(nextLanguage);
    };

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => void run();
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(schedule, { timeout: 3500 });
    } else {
      timeoutId = setTimeout(schedule, 800);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hydrated]);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const dir = language === "ar" ? "rtl" : "ltr";
    document.body.dir = dir;
    void ensureI18nLanguage(language).then(() => i18n.changeLanguage(language));
  }, [language]);

  const routerBase = useMemo(() => `/${language}`, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
          <TooltipProvider>
            <TrustShieldProvider>
              <PwaInstallProvider>
                <OverlayPriorityProvider>
                <DeferAfterIdle timeout={6000}>
                  <PwaSplashScreen />
                </DeferAfterIdle>
                <PremiumProvider>
                  <ProcessProvider>
                    <GuestSessionInit />
                    <StagedKeysLifecycle />
                    <WouterRouter base={routerBase} ssrPath={ssrPath} ssrSearch={ssrSearch}>
                      <WorkspaceHistoryProvider>
                        <AuthPromptProvider>
                          <DeferAfterIdle timeout={4000}>
                            <PostSignupWelcomeModal />
                            <PostSuccessFeedbackModal />
                          </DeferAfterIdle>
                          <ProcessingModeProvider>
                            <ProcessingMonitorProvider>
                              <PremiumUpsellProvider>
                                <ToolRightSlideProvider>
                                  <CommandPaletteProvider>
                                    <Router uiLang={language} />
                                    <DeferAfterIdle timeout={3000}>
                                      <PremiumSlidePanel />
                                      <ToolRightSlidePanel />
                                    </DeferAfterIdle>
                                  </CommandPaletteProvider>
                                </ToolRightSlideProvider>
                              </PremiumUpsellProvider>
                            </ProcessingMonitorProvider>
                          </ProcessingModeProvider>
                        </AuthPromptProvider>
                      </WorkspaceHistoryProvider>
                    </WouterRouter>
                    <Toaster />
                    <SonnerToaster richColors position="top-center" />
                  </ProcessProvider>
                </PremiumProvider>
                </OverlayPriorityProvider>
              </PwaInstallProvider>
            </TrustShieldProvider>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
