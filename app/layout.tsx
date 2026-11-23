import type { Metadata } from "next";

import { Navbar } from "@/components/layout/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EuroElite – Scouting Platform", template: "%s · EuroElite" },
  description: "Live EuroLeague player and team stats, form and scouting.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 pt-10 pb-24 sm:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
