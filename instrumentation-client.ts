import * as Sentry from "@sentry/nextjs";

// Error monitoring (browser). Does nothing until NEXT_PUBLIC_SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Send as little personal data as possible: no user info, cookies, headers,
  // request bodies, query strings or database values.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  // Noise that is not a FreshPoint bug.
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
