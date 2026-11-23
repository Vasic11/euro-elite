import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Koren projekta je ovaj folder. Bez ovoga Next traži package-lock.json naviše
  // i može da izabere pogrešan folder (npr. C:\Users\user), pa ne prati izmene
  // fajlova kako treba (zato se ranije prikazivao stari CSS).
  turbopack: { root: path.join(__dirname) },
  images: {
    // Slike igrača i grbovi klubova dolaze sa CDN-ova koje koristi EuroLeague.
    remotePatterns: [
      { protocol: "https", hostname: "media-cdn.incrowdsports.com" },
      { protocol: "https", hostname: "media-cdn.cortextech.io" },
    ],
  },
};

export default nextConfig;
