/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 💡 FIXED: Direct array configuration whitelists both ImageKit subdomains and Clerk image engines
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "*.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
};

module.exports = nextConfig;
