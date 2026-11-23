import Image from "next/image";
import Link from "next/link";

import type { StandingRow } from "@/lib/stats/standings";

/**
 * Tabela lige. Prvih 6 ide direktno u plej-of, 7-10 u play-in (EuroLeague format),
 * što je označeno linijom sa leve strane i legendom ispod.
 * `compact` prikazuje manje kolona (za početnu), `highlight` podebljava jedan tim.
 */
export function StandingsTable({
  rows,
  highlight,
  compact = false,
  limit,
}: {
  rows: StandingRow[];
  highlight?: string;
  compact?: boolean;
  limit?: number;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;

  return (
    <div className="overflow-hidden rounded-lg bg-paper ring-1 ring-line">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-ink-muted">
            <tr className="border-b border-line">
              <th scope="col" className="w-10 py-2.5 pl-4 font-semibold">
                #
              </th>
              <th scope="col" className="py-2.5 font-semibold">
                Team
              </th>
              {!compact && (
                <th scope="col" className="py-2.5 text-right font-semibold">
                  GP
                </th>
              )}
              <th scope="col" className="py-2.5 text-right font-semibold">
                W
              </th>
              <th scope="col" className="py-2.5 text-right font-semibold">
                L
              </th>
              <th scope="col" className="py-2.5 pr-4 text-right font-semibold">
                +/-
              </th>
              {!compact && (
                <th
                  scope="col"
                  className="hidden py-2.5 pr-4 font-semibold sm:table-cell"
                >
                  Last 5
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => {
              const rank = i + 1;
              const zone = rank <= 6 ? "playoffs" : rank <= 10 ? "playin" : null;
              const diff = row.pointsFor - row.pointsAgainst;
              const isHighlighted = row.team.code === highlight;
              return (
                <tr
                  key={row.team.code}
                  className={`border-b border-line last:border-0 ${isHighlighted ? "bg-accent-soft" : ""} ${
                    zone === "playoffs"
                      ? "shadow-[inset_3px_0_0_var(--color-accent)]"
                      : zone === "playin"
                        ? "shadow-[inset_3px_0_0_#8a8e95]"
                        : ""
                  }`}
                >
                  <td className="py-2.5 pl-4 font-display text-lg font-bold text-ink-muted">
                    {rank}
                  </td>
                  <td className="py-2.5">
                    <Link
                      href={`/teams/${row.team.code.toLowerCase()}`}
                      className="flex items-center gap-2.5 font-semibold hover:text-accent-ink"
                    >
                      {row.team.crestUrl && (
                        <Image
                          src={row.team.crestUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <span className={isHighlighted ? "font-bold" : ""}>
                        {row.team.shortName}
                      </span>
                    </Link>
                  </td>
                  {!compact && (
                    <td className="py-2.5 text-right text-ink-muted">{row.played}</td>
                  )}
                  <td className="py-2.5 text-right font-display text-lg font-bold">
                    {row.wins}
                  </td>
                  <td className="py-2.5 text-right font-display text-lg font-bold text-ink-muted">
                    {row.losses}
                  </td>
                  <td
                    className={`py-2.5 pr-4 text-right font-semibold ${diff > 0 ? "text-[#1a7f37]" : diff < 0 ? "text-[#c62828]" : ""}`}
                  >
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </td>
                  {!compact && (
                    <td className="hidden py-2.5 pr-4 sm:table-cell">
                      <span className="flex gap-1">
                        {row.lastFive.map((r, j) => (
                          <span
                            key={j}
                            className={`flex h-5 w-5 items-center justify-center rounded-sm text-[11px] font-bold text-white ${
                              r === "W" ? "bg-[#1a7f37]" : "bg-[#c62828]"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[3px] bg-accent" aria-hidden /> Playoffs (1-6)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[3px] bg-[#8a8e95]" aria-hidden /> Play-in (7-10)
        </span>
      </p>
    </div>
  );
}
