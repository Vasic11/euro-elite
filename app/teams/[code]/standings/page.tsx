import { notFound } from "next/navigation";

import { StandingsTable } from "@/components/standings/StandingsTable";
import { getTeam } from "@/lib/euroleague/players";
import { getStandings } from "@/lib/euroleague/standings";

export default async function TeamStandingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const team = await getTeam((await params).code);
  if (!team) notFound();
  return <StandingsTable rows={await getStandings()} highlight={team.code} />;
}
