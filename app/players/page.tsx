import type { Metadata } from "next";

import { PlayerExplorer } from "@/components/players/PlayerExplorer";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPlayers } from "@/lib/euroleague/players";

export const metadata: Metadata = {
  title: "Players",
  description: "Every active EuroLeague player with live per-game averages.",
};

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <div>
      <PageHeader
        title="Players"
        description="Every active EuroLeague player with per-game averages for this season."
      />
      <PlayerExplorer players={players} />
    </div>
  );
}
