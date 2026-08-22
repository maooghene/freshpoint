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

module.exports = nextConfig;
