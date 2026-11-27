import Image from "next/image";
import Link from "next/link";

import { getPlayerGames } from "@/lib/data/games";
import { SEASON_LABEL } from "@/lib/euroleague/config";
import { type PlayerGameLine, seasonRows, statRow } from "@/lib/stats/boxScore";

import { SeasonStatsTable } from "./SeasonStatsTable";
import { StatTable } from "./StatTable";

/**
 * Season table (Averages / Totals). An async server component in <Suspense>,
 * like PlayerForm: the rest of the profile shows first.
 */
export async function PlayerSeasonStats({ code }: { code: string }) {
  let games: PlayerGameLine[];
  try {
    games = await getPlayerGames(code);
  } catch {
    return <Unavailable message="Detailed season stats are unavailable right now." />;
  }

  const averages = seasonRows(games, "averages");
  if (averages.length === 0) return null;
  return (
    <SeasonStatsTable
      seasonLabel={SEASON_LABEL}
      rows={{ averages, totals: seasonRows(games, "totals") }}
    />
  );
}

/** Every game he played, newest first, with every box score column. */
export async function PlayerGameLog({ code }: { code: string }) {
  let games: PlayerGameLine[];
  try {
    games = await getPlayerGames(code);
  } catch {
    return <Unavailable message="The game log is unavailable right now." />;
  }

  const played = games.filter((g) => g.line.seconds > 0).toReversed();
  if (played.length === 0) return null;

  return (
    <section className="space-y-5 rounded-lg bg-paper p-6 ring-1 ring-line sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-extrabold uppercase">Game log</h2>
        <p className="text-sm text-ink-muted">
          Every game he played this season, newest first
        </p>
      </div>

      <div className="-mx-6 sm:mx-0">
        <StatTable
          caption={`Game log, ${SEASON_LABEL} season`}
          items={played}
          getKey={(g) => String(g.gameCode)}
          getRow={(g) => statRow([g.line], "totals")!}
          variant="games"
          lead={{
            header: "Round",
            cell: (g) => (
              <Link
                href={`/teams/${g.opponent.code.toLowerCase()}`}
                className="group/opp flex items-center gap-2 font-semibold hover:text-accent-ink"
              >
                <span className="w-6 font-display text-base text-ink-faint tabular-nums">
                  {g.round}
                </span>
                <span className="w-4 text-xs font-normal text-ink-faint">
                  {g.isHome ? "vs" : "at"}
                </span>
                {g.opponent.crestUrl && (
                  <Image
                    src={g.opponent.crestUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="h-[22px] w-[22px] object-contain"
                  />
                )}
                {/* TV code on a phone, so the sticky column leaves room for the stats */}
                <abbr title={g.opponent.name} className="no-underline sm:hidden">
                  {g.opponentTvCode}
                </abbr>
                <span className="hidden group-hover/opp:underline sm:inline">
                  {g.opponent.shortName}
                </span>
              </Link>
            ),
          }}
          extra={[
            {
              header: "Result",
              cell: (g) => (
                <span className="tabular-nums">
                  <span
                    className={`mr-1.5 inline-block w-5 rounded-sm text-center text-xs font-bold text-white ${
                      g.won ? "bg-[#1a7f37]" : "bg-[#c62828]"
                    }`}
                  >
                    {g.won ? "W" : "L"}
                  </span>
                  {g.teamScore}–{g.opponentScore}
                </span>
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-paper p-6 text-sm text-ink-muted ring-1 ring-line">
      {message} Season averages above are up to date.
    </p>
  );
}

export function StatsSkeleton({ label }: { label: string }) {
  return (
    <div
      className="h-64 animate-pulse rounded-lg bg-paper ring-1 ring-line"
      aria-label={label}
    />
  );
}
