import * as Sentry from "@sentry/node";

export const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("ℹ️  SENTRY_DSN not set — Sentry disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    // Capture unhandled promise rejections
    integrations: [Sentry.expressIntegration()],
  });

  // Must be first middleware
  app.use(Sentry.requestHandler());
  app.use(Sentry.tracingHandler());

  console.log("✅ Sentry initialized");
};

// Must be registered after all routes, before the generic error handler
export const sentryErrorHandler = () => Sentry.expressErrorHandler();

export { Sentry };
