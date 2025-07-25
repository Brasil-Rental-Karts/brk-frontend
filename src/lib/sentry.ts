import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || "development";

  if (!dsn) {
    // eslint-disable-next-line no-console
    console.warn("Sentry DSN not found. Error monitoring will be disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment,
    // Performance monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    // Session replay
    replaysSessionSampleRate: environment === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
