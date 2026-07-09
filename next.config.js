/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── 1️⃣ GLOBAL STORAGE REMOTE PATTERNS WHITELIST ──
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "freshpoint.com", // Added to allow your fresh production paths
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
        // CORRECTED: Stripped out illegal url separator characters (://) to fix image routing crashes
        hostname: "clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
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
