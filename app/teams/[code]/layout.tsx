import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GameRow } from "@/components/games/GameRow";
import { TeamHeader } from "@/components/teams/TeamHeader";
import { TeamTabs } from "@/components/teams/TeamTabs";
import { BackLink } from "@/components/ui/BackLink";
import { getTeam, getTeams } from "@/lib/euroleague/players";
import { getStandings, getTeamGames } from "@/lib/euroleague/standings";
import { rankMap } from "@/lib/stats/standings";

type Props = { params: Promise<{ code: string }>; children: React.ReactNode };

/**
 * Sve stranice klubova (i njihovi tabovi) se prave unapred, pri build-u.
 * Posetilac dobija gotovu stranicu odmah, a podaci se osvežavaju u pozadini (ISR).
 */
export async function generateStaticParams() {
  const teams = await getTeams();
  return teams.map((t) => ({ code: t.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: Omit<Props, "children">): Promise<Metadata> {
  const team = await getTeam((await params).code);
  return team
    ? {
        title: team.name,
        description: `${team.name}: head coach, results, schedule and roster by position.`,
      }
    : { title: "Team not found" };
}

/**
 * Zajednički deo svih stranica kluba (zaglavlje, naredna utakmica, tabovi).
 * Layout ostaje na ekranu dok se menjaju tabovi; menja se samo {children}.
 */
export default async function TeamLayout({ params, children }: Props) {
  const { code } = await params;
  const team = await getTeam(code);
  if (!team) notFound();

  const [{ results, upcoming }, standings] = await Promise.all([
    getTeamGames(team.code),
    getStandings(),
  ]);
  const nextGame = upcoming[0];
  const basePath = `/teams/${team.code.toLowerCase()}`;

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <BackLink href="/teams" label="All teams" />
        <TeamHeader team={team} />
      </div>

      {nextGame && (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold uppercase">Next game</h2>
          <ul>
            <GameRow game={nextGame} highlight={team.code} ranks={rankMap(standings)} />
          </ul>
        </section>
      )}

      <div className="space-y-8">
        <TeamTabs
          basePath={basePath}
          counts={{
            roster: team.players.length,
            results: results.length,
            schedule: upcoming.length,
          }}
        />
        {children}
      </div>
    </div>
  );
}
