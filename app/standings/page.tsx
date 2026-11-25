import type { Metadata } from "next";

import { GameRow } from "@/components/games/GameRow";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { getNextRound, getStandings } from "@/lib/data/standings";
import { rankMap } from "@/lib/stats/standings";

export const metadata: Metadata = {
  title: "Standings",
  description: "EuroLeague regular season standings and the next round of games.",
};

export default async function StandingsPage() {
  const [standings, next] = await Promise.all([getStandings(), getNextRound()]);
  const ranks = rankMap(standings);

  return (
    <div className="space-y-12">
      <div>
        <PageHeader
          title="Standings"
          description="Ordered by wins, then point difference. The official table breaks ties by head-to-head results first."
        />
        <StandingsTable rows={standings} />
      </div>

      {next.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-3xl font-extrabold uppercase">
            Round {next[0].round}
          </h2>
          <ul className="space-y-2">
            {next.map((g) => (
              <GameRow key={g.gameCode} game={g} ranks={ranks} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
