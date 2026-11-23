"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tabovi kluba. Svaki tab je posebna stranica (/teams/zal/results), pa može
 * da se napravi unapred pri build-u; aktivni tab se čita iz putanje.
 */
export function TeamTabs({
  basePath,
  counts,
}: {
  basePath: string;
  counts: { roster: number; results: number; schedule: number };
}) {
  const pathname = usePathname();
  const tabs = [
    { href: basePath, label: "Roster", count: counts.roster },
    { href: `${basePath}/results`, label: "Results", count: counts.results },
    { href: `${basePath}/schedule`, label: "Schedule", count: counts.schedule },
    { href: `${basePath}/standings`, label: "Standings" },
  ];

  return (
    <nav
      aria-label="Team sections"
      className="flex gap-1 overflow-x-auto border-b border-line"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 px-4 py-3 font-display text-xl font-bold transition-colors ${
              active ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-base font-semibold text-ink-faint">
                {tab.count}
              </span>
            )}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-t-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
