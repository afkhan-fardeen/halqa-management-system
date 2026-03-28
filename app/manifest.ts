import type { MetadataRoute } from "next";
import { PWA_ASSETS } from "@/lib/constants/pwa-assets";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Qalbee",
    short_name: "Qalbee",
    description: "Daily worship, outreach, and contributions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    background_color: "#fafaf9",
    theme_color: "#4338ca",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: PWA_ASSETS.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ASSETS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ASSETS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: PWA_ASSETS.iconSvg,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
