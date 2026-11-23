import type { Metadata } from "next";

import { Navbar } from "@/components/layout/Navbar";

// Fontovi su u projektu (npm @fontsource), pa ne zavise od Google Fonts-a pri build-u.
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EuroElite – EuroLeague stats and form", template: "%s · EuroElite" },
  description: "Live EuroLeague player and team stats, current form and season leaders.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 pt-8 pb-24 sm:px-8 sm:pt-12">
          {children}
        </main>
      </body>
    </html>
  );
}
