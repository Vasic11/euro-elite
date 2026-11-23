import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PlayerForm, PlayerFormSkeleton } from "@/components/players/form/PlayerForm";
import { MissedGameBadge } from "@/components/players/MissedGameBadge";
import { PlayerPanel } from "@/components/players/PlayerPanel";
import { RadarChart } from "@/components/players/RadarChart";
import { StatTile } from "@/components/ui/StatTile";
import { BackLink } from "@/components/ui/BackLink";
import { ageFrom, formatStat, POSITION_LABEL, splitName } from "@/lib/euroleague/format";
import { getPlayer, getTeam } from "@/lib/euroleague/players";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

/**
 * Dugme za povratak vodi tamo odakle je korisnik došao (?from=/teams/zal).
 * Prihvatamo samo naše poznate putanje, nikad spoljni URL (inače bi neko mogao
 * da napravi link koji vodi na tuđi sajt).
 */
async function backTarget(
  from: string | string[] | undefined,
): Promise<{ href: string; label: string }> {
  if (from === "/") return { href: "/", label: "Home" };
  const teamCode =
    typeof from === "string" ? from.match(/^\/teams\/([a-z]+)$/)?.[1] : undefined;
  if (teamCode) {
    const team = await getTeam(teamCode);
    if (team) return { href: `/teams/${teamCode}`, label: `Back to ${team.shortName}` };
  }
  return { href: "/players", label: "All players" };
}

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
export default async function PlayerPage({ params, searchParams }: Props) {
  const [{ code }, { from }] = await Promise.all([params, searchParams]);
  const [player, back] = await Promise.all([getPlayer(code), backTarget(from)]);
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
      <BackLink href={back.href} label={back.label} />

      <section className="grid overflow-hidden rounded-lg bg-paper ring-1 ring-line md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
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
            {player.missedLastGame && <MissedGameBadge className="mb-3" />}
            <p className="text-2xl leading-tight text-ink-muted">{first}</p>
            <h1 className="font-display text-6xl leading-[0.88] font-extrabold uppercase sm:text-7xl">
              {last}
            </h1>
            <p className="mt-3 flex items-center gap-2 font-semibold">
              {player.team.crestUrl && (
                <Image
                  src={player.team.crestUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-7 w-7 object-contain"
                />
              )}
              <Link
                href={`/teams/${player.team.code.toLowerCase()}`}
                className="hover:text-accent-ink hover:underline"
              >
                {player.team.name}
              </Link>
              {player.jerseyNumber && (
                <span className="font-normal text-ink-muted">#{player.jerseyNumber}</span>
              )}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
            {facts.map(([label, value]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-xs text-ink-muted">{label}</dt>
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
            <p className="mt-auto rounded-md bg-canvas p-4 text-sm text-ink-muted">
              No games played this season yet. Stats appear after his first game.
            </p>
          )}
        </div>
      </section>

      {averages && (
        <>
          <section className="grid items-center gap-8 rounded-lg bg-paper p-6 ring-1 ring-line sm:p-8 lg:grid-cols-[auto_1fr]">
            <div>
              <h2 className="font-display text-2xl font-extrabold uppercase">
                Season profile
              </h2>
              <p className="text-sm text-ink-muted">
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
