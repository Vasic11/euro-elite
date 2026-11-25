import { notFound } from "next/navigation";

import { GameList } from "@/components/games/GameList";
import { getTeam } from "@/lib/data/players";
import { getStandings, getTeamGames } from "@/lib/data/standings";
import { rankMap } from "@/lib/stats/standings";

export default async function TeamResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const team = await getTeam((await params).code);
  if (!team) notFound();

  const [games, standings] = await Promise.all([getTeamGames(team.code), getStandings()]);
  return (
    <GameList
      games={games.results}
      highlight={team.code}
      empty="No games played yet."
      ranks={rankMap(standings)}
    />
  );
}
