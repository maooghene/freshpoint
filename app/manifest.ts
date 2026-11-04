import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreshPoint",
    short_name: "FreshPoint",
    description:
      "Book appointments and order from trusted local businesses near you.",
    id: "/",
    start_url: "/explore",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F6F2E8",
    theme_color: "#4B2E83",
    categories: ["lifestyle", "shopping", "business"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Explore", url: "/explore" },
      { name: "My bookings", url: "/bookings" },
    ],
  };
}
