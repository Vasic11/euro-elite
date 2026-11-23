import type { ScheduledGame } from "@/lib/stats/aggregate";

import { GameRow } from "./GameRow";

export function GameList({
  games,
  highlight,
  empty,
  ranks,
}: {
  games: ScheduledGame[];
  highlight?: string;
  empty: string;
  ranks?: Map<string, number>;
}) {
  if (games.length === 0) return <p className="text-ink-muted">{empty}</p>;
  return (
    <ul className="space-y-2">
      {games.map((g) => (
        <GameRow key={g.gameCode} game={g} highlight={highlight} ranks={ranks} />
      ))}
    </ul>
  );
}
