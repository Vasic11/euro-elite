import Link from "next/link";

/** Upečatljivo dugme za povratak (npr. "All teams"); strelica klizne ulevo na hover. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-11 items-center gap-2 rounded-full bg-paper pr-5 pl-2 font-display text-lg font-bold ring-1 ring-line transition-colors hover:bg-ink hover:text-white hover:ring-ink"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink transition-transform duration-300 group-hover:-translate-x-0.5">
        <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
          <path
            d="M10 3L5 8l5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label}
    </Link>
  );
}
