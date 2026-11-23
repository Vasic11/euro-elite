/**
 * Oznaka za igrača koji nije bio u sastavu na poslednjoj utakmici svog tima.
 * Namerno ne piše "Injured": API ne kaže razlog (povreda, bolest, odluka trenera).
 */
export function MissedGameBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Not in the squad for his team's last game"
      className={`inline-flex items-center gap-1 rounded bg-[#c62828] px-2 py-0.5 font-display text-sm font-bold text-white ${className}`}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
        <path
          d="M6 1v7M6 10.2v.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      Missed last game
    </span>
  );
}
