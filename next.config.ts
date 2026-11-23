import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Slike igrača i grbovi klubova dolaze sa CDN-ova koje koristi EuroLeague.
    remotePatterns: [
      { protocol: "https", hostname: "media-cdn.incrowdsports.com" },
      { protocol: "https", hostname: "media-cdn.cortextech.io" },
    ],
  },
};

export default nextConfig;
