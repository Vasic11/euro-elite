import type { Metadata } from "next";

import { TeamCard } from "@/components/teams/TeamCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getTeams } from "@/lib/euroleague/players";

export const metadata: Metadata = {
  title: "Teams",
  description: "All EuroLeague clubs with their head coach, record and roster.",
};

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Pick a club to see its head coach and full roster by position."
      />
      <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {teams.map((team) => (
          <li key={team.code}>
            <TeamCard team={team} />
          </li>
        ))}
      </ul>
    </div>
  );
}
