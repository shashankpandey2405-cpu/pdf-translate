import * as Sentry from "@sentry/nextjs";
import {
  beforeSendScrub,
  denyUrls,
  isSentryDisabled,
  parseSampleRate,
  resolveSentryDsn,
  resolveSentryEnvironment,
  resolveSentryRelease,
} from "./sentry.shared";

const SENTRY_TUNNEL =
  (process.env.NEXT_PUBLIC_SENTRY_TUNNEL as string | undefined)?.trim() ||
  (process.env.VITE_SENTRY_TUNNEL as string | undefined)?.trim() ||
  undefined;

const isProd = process.env.NODE_ENV === "production";

if (!isSentryDisabled()) {
  const integrations: ReturnType<typeof Sentry.browserTracingIntegration>[] = [
    Sentry.browserTracingIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ];

  if (isProd || process.env.NEXT_PUBLIC_SENTRY_REPLAY === "1") {
    integrations.push(
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    );
  }

  if (process.env.NEXT_PUBLIC_SENTRY_FEEDBACK === "1") {
    integrations.push(Sentry.feedbackIntegration({ colorScheme: "system" }));
  }

  Sentry.init({
    dsn: resolveSentryDsn(),
    tunnel: SENTRY_TUNNEL,
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
    sendDefaultPii: false,
    attachStacktrace: true,
    maxBreadcrumbs: 100,
    integrations,
    tracesSampleRate: parseSampleRate(
      "SENTRY_TRACES_SAMPLE_RATE",
      isProd ? 0.12 : 1,
    ),
    replaysSessionSampleRate: parseSampleRate(
      "SENTRY_REPLAY_SESSION_SAMPLE_RATE",
      isProd ? 0.05 : 0,
    ),
    replaysOnErrorSampleRate: parseSampleRate(
      "SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE",
      1,
    ),
    denyUrls,
    beforeSend: beforeSendScrub,
  });
}
