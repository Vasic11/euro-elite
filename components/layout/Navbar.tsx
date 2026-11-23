"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
];

function isActive(pathname: string, href: string) {
  // "/" je aktivan samo na početnoj; ostali i na podstranicama (/players/123).
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Klijentska komponenta jer koristi usePathname() da zna koja je stranica otvorena. */
export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="EuroElite home">
          <Logo />
          <span className="font-display text-2xl leading-none font-extrabold tracking-tight">
            Euro<span className="text-accent-ink">Elite</span>
          </span>
        </Link>

        <nav className="flex h-full items-stretch gap-1 sm:gap-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center px-2 font-display text-lg font-semibold transition-colors sm:px-3 ${
                  active ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-accent sm:inset-x-3"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/** Znak: lopta u narandžastom kvadratu sa zakošenim uglom, isti ugao kao na karticama. */
function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <path d="M0 0h32v24l-8 8H0z" className="fill-accent" />
      <circle cx="15" cy="15" r="8.5" fill="none" stroke="white" strokeWidth="2" />
      <path
        d="M6.5 15h17M15 6.5v17M9 9c3 3 3 9 0 12M21 9c-3 3-3 9 0 12"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
      />
    </svg>
  );
}
