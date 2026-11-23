"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Scouting Hub" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
];

function isActive(pathname: string, href: string) {
  // "/" je aktivan samo na početnoj; ostali i na podstranicama (/players/123).
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Klijentska komponenta jer koristi usePathname() da zna koja je stranica otvorena.
 * Aktivni tab sada zavisi od URL-a, a ne od useState, pa radi i dugme "nazad"
 * u browseru i deljenje linkova.
 */
export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-euro-border bg-euro-bg/85 sticky top-0 z-50 border-b px-4 py-3.5 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link
          href="/"
          className="text-euro-neon flex items-center gap-1 text-lg font-black tracking-widest select-none"
        >
          <span className="text-white">🏀</span> EUROELITE
        </Link>

        <nav className="border-euro-border-soft bg-euro-card flex items-center gap-1 rounded-xl border p-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative isolate rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                  active ? "text-black" : "text-gray-400 hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeTabIndicator"
                    className="bg-euro-neon absolute inset-0 -z-10 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 33 }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
