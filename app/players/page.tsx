import type { Metadata } from "next";

import { PlayerExplorer } from "@/components/players/PlayerExplorer";
import { getPlayers } from "@/lib/euroleague/players";

export const metadata: Metadata = {
  title: "Players",
  description: "Every active EuroLeague player with live per-game averages.",
};

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div className="space-y-6">
      <header className="border-euro-border border-b pb-5">
        <h1 className="text-3xl font-black text-white">All Players Database</h1>
      </header>
      <PlayerExplorer players={players} />
    </div>
  );
}
