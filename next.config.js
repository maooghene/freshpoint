/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── 1️⃣ GLOBAL STORAGE REMOTE PATTERNS WHITELIST ──
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "freshpoint.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // ── 2️⃣ FIXED Root-Level EXPERIMENTAL NEXT.JS SETTINGS ──
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs/config");

// Sentry wraps the build so errors point at your real source lines. Uploading
// source maps needs SENTRY_AUTH_TOKEN (set it in Vercel); without it the build
// still works and only the readable stack traces are missing.
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "mao-dev",
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
