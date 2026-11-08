import * as Sentry from "@sentry/nextjs";

// Error monitoring (server). Does nothing until SENTRY_DSN is set, so local
// development and previews stay quiet.
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.CONTEXT || process.env.NODE_ENV,
  // Keep performance sampling low; errors are always sent.
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
});
