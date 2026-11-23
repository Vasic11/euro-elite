import type { Metadata } from "next";

import { TeamAccordion } from "@/components/teams/TeamAccordion";
import { PageHeader } from "@/components/ui/PageHeader";
import { getTeams } from "@/lib/euroleague/players";

export const metadata: Metadata = {
  title: "Teams",
  description: "EuroLeague rosters with per-player averages.",
};

type Props = { searchParams: Promise<{ team?: string | string[] }> };

export default async function TeamsPage({ searchParams }: Props) {
  const [teams, { team }] = await Promise.all([getTeams(), searchParams]);
  const initialExpanded =
    typeof team === "string" && teams.some((t) => t.code === team) ? team : null;

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Open a club to see its roster and how each player is doing this season."
      />
      <TeamAccordion teams={teams} initialExpanded={initialExpanded} />
    </div>
  );
}
