import { formatDayMonth, formatGameDate } from "@/lib/euroleague/format";
import { OUT_MIN_GAMES } from "@/lib/stats/aggregate";

/**
 * Oznaka za igrača koji je duže van sastava svog kluba (`playersOutSince`).
 * Kao i "Missed last game", ne kaže razlog: API ga ne zna.
 */
export function OutBadge({
  since,
  className = "",
}: {
  since: string;
  className?: string;
}) {
  return (
    <span
      title={`Not in his team's squad since ${formatGameDate(since)} (${OUT_MIN_GAMES}+ games in a row)`}
      className={`inline-flex items-center gap-1 rounded bg-ink px-2 py-0.5 font-display text-sm font-bold text-white ${className}`}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3 text-accent" aria-hidden>
        <circle
          cx="6"
          cy="6"
          r="4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M6 3.6V6l1.6 1.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      Out since {formatDayMonth(since)}
    </span>
  );
}
