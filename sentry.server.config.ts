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

if (!isSentryDisabled()) {
  Sentry.init({
    dsn: resolveSentryDsn(),
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
    sendDefaultPii: false,
    attachStacktrace: true,
    maxBreadcrumbs: 100,
    tracesSampleRate: parseSampleRate(
      "SENTRY_TRACES_SAMPLE_RATE",
      process.env.NODE_ENV === "production" ? 0.12 : 1,
    ),
    denyUrls,
    beforeSend: beforeSendScrub,
  });
}
