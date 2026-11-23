import type { Metadata } from "next";

import { TeamAccordion } from "@/components/teams/TeamAccordion";
import { getTeams } from "@/lib/euroleague/players";

export const metadata: Metadata = {
  title: "Teams",
  description: "EuroLeague rosters with per-player averages.",
};

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-6">
      <header className="border-euro-border border-b pb-5">
        <h1 className="text-3xl font-black text-white">Teams Terminal</h1>
      </header>
      <TeamAccordion teams={teams} />
    </div>
  );
}
