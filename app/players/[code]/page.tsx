import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlayerForm, PlayerFormSkeleton } from "@/components/players/form/PlayerForm";
import { PlayerPanel } from "@/components/players/PlayerPanel";
import { RadarChart } from "@/components/players/RadarChart";
import { StatTile } from "@/components/ui/StatTile";
import { ageFrom, formatStat, POSITION_LABEL, splitName } from "@/lib/euroleague/format";
import { getPlayer } from "@/lib/euroleague/players";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await getPlayer((await params).code);
  return player
    ? {
        title: player.name,
        description: `${player.name}, ${player.team.name}: season stats and current form.`,
      }
    : { title: "Player not found" };
}

/** Profil igrača: /players/[code]. */
export default async function PlayerPage({ params }: Props) {
  const { code } = await params;
  const player = await getPlayer(code);
  if (!player) notFound(); // prikazuje app/not-found.tsx

  const { averages } = player;
  const { first, last } = splitName(player.name);
  const age = ageFrom(player.birthDate);

  const facts: [string, string][] = [
    ["Position", player.position ? POSITION_LABEL[player.position] : "—"],
    ["Height", player.heightCm ? `${player.heightCm} cm` : "—"],
    ["Weight", player.weightKg ? `${player.weightKg} kg` : "—"],
    ["Age", age != null ? String(age) : "—"],
    ["Nationality", player.country ?? "—"],
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/players"
        className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm font-semibold"
      >
        <span aria-hidden>←</span> All players
      </Link>

      <section className="bg-paper ring-line grid overflow-hidden rounded-lg ring-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative aspect-square md:aspect-auto md:min-h-[460px]">
          <PlayerPanel
            player={player}
            size="hero"
            priority
            sizes="(min-width: 768px) 40vw, 100vw"
          />
        </div>

        <div className="flex flex-col gap-8 p-6 sm:p-8">
          <div>
            <p className="text-ink-muted text-2xl leading-tight">{first}</p>
            <h1 className="font-display text-6xl leading-[0.88] font-extrabold uppercase sm:text-7xl">
              {last}
            </h1>
            <p className="mt-3 flex items-center gap-2 font-semibold">
              {player.team.crestUrl && (
                <Image
                  src={player.team.crestUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              )}
              {player.team.name}
              {player.jerseyNumber && (
                <span className="text-ink-muted font-normal">#{player.jerseyNumber}</span>
              )}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
            {facts.map(([label, value]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-ink-muted text-xs">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          {averages ? (
            <dl className="mt-auto grid grid-cols-2 gap-5 sm:grid-cols-4">
              <StatTile label="PIR" value={formatStat(averages.pir)} accent />
              <StatTile label="Points" value={formatStat(averages.points)} />
              <StatTile label="Rebounds" value={formatStat(averages.rebounds)} />
              <StatTile label="Assists" value={formatStat(averages.assists)} />
            </dl>
          ) : (
            <p className="bg-canvas text-ink-muted mt-auto rounded-md p-4 text-sm">
              No games played this season yet. Stats appear after his first game.
            </p>
          )}
        </div>
      </section>

      {averages && (
        <>
          <section className="bg-paper ring-line grid items-center gap-8 rounded-lg p-6 ring-1 sm:p-8 lg:grid-cols-[auto_1fr]">
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase">
                Season profile
              </h2>
              <p className="text-ink-muted text-sm">
                Per game, {averages.games} games played
              </p>
              <div className="mt-2 flex justify-center">
                <RadarChart averages={averages} />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <StatTile size="sm" label="Minutes" value={formatStat(averages.minutes)} />
              <StatTile
                size="sm"
                label="Field goals"
                value={formatStat(averages.fieldGoalPct)}
                suffix="%"
              />
              <StatTile
                size="sm"
                label="Three pointers"
                value={formatStat(averages.threePointPct)}
                suffix="%"
              />
              <StatTile
                size="sm"
                label="Free throws"
                value={formatStat(averages.freeThrowPct)}
                suffix="%"
              />
              <StatTile size="sm" label="Steals" value={formatStat(averages.steals)} />
              <StatTile size="sm" label="Blocks" value={formatStat(averages.blocks)} />
            </dl>
          </section>

          <Suspense fallback={<PlayerFormSkeleton />}>
            <PlayerForm code={player.code} seasonPir={averages.pir} />
          </Suspense>
        </>
      )}
    </div>
  );
}
