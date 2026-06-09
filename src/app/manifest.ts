import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Errandboi — Fast Logistics",
    short_name: "Errandboi",
    description: "Book rides, send packages, and shop at the market — all in one app.",
    start_url: "/auth/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#f97316",
    categories: ["transportation", "shopping", "lifestyle"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Book a Ride",
        short_name: "Ride",
        description: "Book a bike, car or keke",
        url: "/book/ride",
        icons: [{ src: "/icon", sizes: "96x96" }],
      },
      {
        name: "Send Errandboi",
        short_name: "Errand",
        description: "Send to market",
        url: "/book/errand",
        icons: [{ src: "/icon", sizes: "96x96" }],
      },
    ],
    screenshots: [],
  };
}
