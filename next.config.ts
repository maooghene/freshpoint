import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 💡 FIXED: Whitelists both the direct link paths and custom URL endpoints from ImageKit
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "*.imagekit.io", // Catch-all wildcard subdomain for customized merchant endpoints
      },
    ],
  },
};

export default nextConfig;
