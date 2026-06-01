import * as Sentry from "@sentry/nextjs";
import {
  beforeSendScrub,
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
    tracesSampleRate: parseSampleRate("SENTRY_TRACES_SAMPLE_RATE", 0.02),
    beforeSend: beforeSendScrub,
  });
}
