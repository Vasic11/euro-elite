import type { Player } from "@/lib/euroleague/types";

import { PlayerCard } from "./PlayerCard";

export function PlayerGrid({ players }: { players: Player[] }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {players.map((player) => (
        <li key={player.code}>
          <PlayerCard player={player} />
        </li>
      ))}
    </ul>
  );
}
