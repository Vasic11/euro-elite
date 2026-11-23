import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PlayerImage } from "@/components/players/PlayerImage";
import { RadarChart } from "@/components/players/RadarChart";
import { StatTile } from "@/components/ui/StatTile";
import { ageFrom, formatStat } from "@/lib/euroleague/format";
import { getPlayer } from "@/lib/euroleague/players";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await getPlayer((await params).code);
  return player
    ? {
        title: player.name,
        description: `${player.name} – ${player.team.name} season stats.`,
      }
    : { title: "Player not found" };
}

/** Profil igrača: /players/[code]. Svaki igrač sada ima svoj URL koji može da se podeli. */
export default async function PlayerPage({ params }: Props) {
  const { code } = await params;
  const player = await getPlayer(code);
  if (!player) notFound(); // prikazuje app/not-found.tsx

  const { averages } = player;
  const age = ageFrom(player.birthDate);

  const details: [string, string][] = [
    ["Nationality", player.country ?? "—"],
    ["Position", player.position ?? "—"],
    ["Height", player.heightCm ? `${player.heightCm} cm` : "—"],
    ["Weight", player.weightKg ? `${player.weightKg} kg` : "—"],
    ["Age", age != null ? String(age) : "—"],
    ["Jersey", player.jerseyNumber ? `#${player.jerseyNumber}` : "—"],
  ];

  return (
    <div>
      <Link
        href="/players"
        className="mb-6 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-gray-500 uppercase transition select-none hover:text-white"
      >
        <span aria-hidden>🡨</span> Back to players
      </Link>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <div className="border-euro-border bg-euro-card relative h-[440px] overflow-hidden rounded-3xl border shadow-xl">
            <PlayerImage
              src={player.imageUrl}
              name={player.name}
              sizes="(min-width: 1024px) 33vw, 100vw"
            />
            {player.position && (
              <span className="bg-euro-neon absolute bottom-6 left-6 z-10 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-wider text-black uppercase shadow-lg">
                {player.position}
              </span>
            )}
          </div>

          <dl className="border-euro-border bg-euro-card space-y-1 rounded-2xl border p-2.5 text-xs font-medium shadow-lg">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="bg-euro-bg/40 flex justify-between rounded-xl p-3"
              >
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-bold text-white">{value}</dd>
              </div>
            ))}
            <div className="bg-euro-bg/40 flex justify-between rounded-xl p-3">
              <dt className="text-gray-500">Team</dt>
              <dd className="text-euro-neon font-bold">{player.team.name}</dd>
            </div>
          </dl>
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <header>
            <h1 className="text-5xl leading-none font-black tracking-tight text-white sm:text-6xl">
              {player.name}
            </h1>
            <p className="mt-2 text-sm font-bold tracking-widest text-gray-500 uppercase">
              {player.team.name}
              {player.jerseyNumber && ` • #${player.jerseyNumber}`}
            </p>
          </header>

          {averages ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatTile label="Points" value={formatStat(averages.points)} highlight />
                <StatTile label="Rebounds" value={formatStat(averages.rebounds)} />
                <StatTile label="Assists" value={formatStat(averages.assists)} />
                <StatTile label="PIR" value={formatStat(averages.pir)} highlight />
              </div>

              <section className="border-euro-border bg-euro-card flex flex-col items-center space-y-6 rounded-3xl border p-6 shadow-xl">
                <div className="flex w-full justify-between font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  <span>Performance Radar</span>
                  <span>{averages.games} games</span>
                </div>

                <RadarChart averages={averages} />

                <div className="border-euro-border/60 grid w-full grid-cols-2 gap-3 border-t pt-6 sm:grid-cols-5">
                  <StatTile size="sm" label="MPG" value={formatStat(averages.minutes)} />
                  <StatTile
                    size="sm"
                    label="FG%"
                    value={formatStat(averages.fieldGoalPct)}
                    suffix="%"
                  />
                  <StatTile
                    size="sm"
                    label="3PT%"
                    value={formatStat(averages.threePointPct)}
                    suffix="%"
                  />
                  <StatTile
                    size="sm"
                    label="FT%"
                    value={formatStat(averages.freeThrowPct)}
                    suffix="%"
                  />
                  <StatTile size="sm" label="STL" value={formatStat(averages.steals)} />
                </div>
              </section>
            </>
          ) : (
            <p className="border-euro-border bg-euro-card rounded-2xl border p-6 text-sm text-gray-400">
              No games played this season yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
