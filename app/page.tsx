import Link from "next/link";

import { ClubStrip } from "@/components/home/ClubStrip";
import { FeaturedPlayer } from "@/components/home/FeaturedPlayer";
import { SeasonLeaders } from "@/components/home/SeasonLeaders";
import { PlayerGrid } from "@/components/players/PlayerGrid";
import { SEASON_LABEL } from "@/lib/euroleague/config";
import { getPlayers, getTeams } from "@/lib/euroleague/players";

/** Početna. Serverska komponenta: podaci se uzimaju na serveru, browser dobija gotov HTML. */
export default async function HomePage() {
  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
  const [featured, ...rest] = players; // getPlayers je već sortiran po PIR-u
  const topPerformers = rest.slice(0, 8);

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
        <div>
          <p className="font-display text-accent-ink text-lg font-semibold">
            EuroLeague {SEASON_LABEL}
          </p>
          <h1 className="font-display mt-2 text-6xl leading-[0.88] font-extrabold uppercase sm:text-7xl xl:text-8xl">
            Every player.
            <br />
            Every round.
          </h1>
          <p className="text-ink-muted mt-5 max-w-md text-lg">
            Season averages, current form and league leaders for all {players.length}{" "}
            players on {teams.length} rosters, updated after every game.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/players"
              className="bg-accent font-display text-ink inline-flex h-12 items-center rounded-md px-6 text-lg font-bold transition-colors hover:bg-[#ff8128]"
            >
              Browse players
            </Link>
            <Link
              href="/teams"
              className="border-ink/20 bg-paper font-display hover:border-ink inline-flex h-12 items-center rounded-md border px-6 text-lg font-bold transition-colors"
            >
              See rosters
            </Link>
          </div>
        </div>

        {featured && <FeaturedPlayer player={featured} />}
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-3xl font-extrabold uppercase">Season leaders</h2>
        <SeasonLeaders players={players} />
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold uppercase">
            Top performers
          </h2>
          <Link
            href="/players"
            className="text-accent-ink text-sm font-semibold hover:underline"
          >
            All players
          </Link>
        </div>
        <PlayerGrid players={topPerformers} />
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-3xl font-extrabold uppercase">Clubs</h2>
        <ClubStrip teams={teams} />
      </section>
    </div>
  );
}
