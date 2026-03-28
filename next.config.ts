import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Allow dev server assets / internal routes when opened from LAN IPs (see .env.example). */
  allowedDevOrigins: ["192.168.8.252"],
  async redirects() {
    return [
      {
        source: "/icon.svg",
        destination: "/icons_and_manifest/icon.svg",
        permanent: true,
      },
      {
        source: "/icon-192.png",
        destination: "/icons_and_manifest/icon-192.png",
        permanent: true,
      },
      {
        source: "/icon-512.png",
        destination: "/icons_and_manifest/icon-512.png",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
