import Link from "next/link";

import { GameRow } from "@/components/games/GameRow";
import { ClubStrip } from "@/components/home/ClubStrip";
import { FeaturedPlayer } from "@/components/home/FeaturedPlayer";
import { SeasonLeaders } from "@/components/home/SeasonLeaders";
import { PlayerGrid } from "@/components/players/PlayerGrid";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { SEASON_LABEL } from "@/lib/euroleague/config";
import { getPlayers, getTeams } from "@/lib/euroleague/players";
import { getNextRound, getStandings } from "@/lib/euroleague/standings";

/** Početna. Serverska komponenta: podaci se uzimaju na serveru, browser dobija gotov HTML. */
export default async function HomePage() {
  const [players, teams, standings, next] = await Promise.all([
    getPlayers(),
    getTeams(),
    getStandings(),
    getNextRound(),
  ]);
  const [featured, ...rest] = players; // getPlayers je već sortiran po PIR-u
  const topPerformers = rest.slice(0, 8);

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
        <div>
          <p className="font-display text-lg font-semibold text-accent-ink">
            EuroLeague {SEASON_LABEL}
          </p>
          <h1 className="mt-2 font-display text-6xl leading-[0.88] font-extrabold uppercase sm:text-7xl xl:text-8xl">
            Every player.
            <br />
            Every round.
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-muted">
            Season averages, current form and league leaders for all {players.length}{" "}
            players on {teams.length} rosters, updated after every game.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/players"
              className="inline-flex h-12 items-center rounded-md bg-accent px-6 font-display text-lg font-bold text-ink transition-colors hover:bg-[#ff8128]"
            >
              Browse players
            </Link>
            <Link
              href="/teams"
              className="inline-flex h-12 items-center rounded-md border border-ink/20 bg-paper px-6 font-display text-lg font-bold transition-colors hover:border-ink"
            >
              See rosters
            </Link>
          </div>
        </div>

        {featured && <FeaturedPlayer player={featured} />}
      </section>

      <section aria-label="Clubs">
        <ClubStrip teams={teams} />
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-3xl font-extrabold uppercase">Season leaders</h2>
        <SeasonLeaders players={players} />
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {next.length > 0 && (
          <section className="space-y-5">
            <h2 className="font-display text-3xl font-extrabold uppercase">
              Round {next[0].round}
            </h2>
            <ul className="space-y-2">
              {next.map((g) => (
                <GameRow key={g.gameCode} game={g} />
              ))}
            </ul>
          </section>
        )}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold uppercase">Standings</h2>
            <Link
              href="/standings"
              className="text-sm font-semibold text-accent-ink hover:underline"
            >
              Full table
            </Link>
          </div>
          <StandingsTable rows={standings} compact limit={10} />
        </section>
      </div>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold uppercase">
            Top performers
          </h2>
          <Link
            href="/players"
            className="text-sm font-semibold text-accent-ink hover:underline"
          >
            All players
          </Link>
        </div>
        <PlayerGrid players={topPerformers} from="/" />
      </section>
    </div>
  );
}
