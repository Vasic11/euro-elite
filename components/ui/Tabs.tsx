import Link from "next/link";

/**
 * Tabovi kao linkovi: izabrani tab je deo URL-a (?tab=results), pa radi
 * dugme "nazad", link može da se podeli, a serverska stranica zna šta da prikaže.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  hrefFor,
}: {
  tabs: { value: T; label: string; count?: number }[];
  active: T;
  hrefFor: (value: T) => string;
}) {
  return (
    <nav
      aria-label="Sections"
      className="flex gap-1 overflow-x-auto border-b border-line"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <Link
            key={tab.value}
            href={hrefFor(tab.value)}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={`relative shrink-0 px-4 py-3 font-display text-xl font-bold transition-colors ${
              isActive ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-base font-semibold text-ink-faint">
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-t-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
