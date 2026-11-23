import type { Player } from "@/lib/euroleague/types";

import { PlayerCard } from "./PlayerCard";

export function PlayerGrid({
  players,
  priorityCount = 0,
}: {
  players: Player[];
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {players.map((player, i) => (
        <li key={player.code}>
          {/* priority: prve slike (iznad pregiba) se učitavaju odmah, ostale lenjo. */}
          <PlayerCard player={player} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
