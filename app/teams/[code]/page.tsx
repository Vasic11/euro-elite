import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PlayerGrid } from "@/components/players/PlayerGrid";
import { BackLink } from "@/components/ui/BackLink";
import { clubColor } from "@/lib/euroleague/clubColors";
import { formatStat, splitName } from "@/lib/euroleague/format";
import { getTeam } from "@/lib/euroleague/players";
import { averageTeamPir } from "@/lib/euroleague/teamStats";
import type { Player, Position } from "@/lib/euroleague/types";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await getTeam((await params).code);
  return team
    ? {
        title: team.name,
        description: `${team.name}: head coach, record and roster by position.`,
      }
    : { title: "Team not found" };
}

const POSITION_GROUPS: { position: Position | null; title: string }[] = [
  { position: "Guard", title: "Guards" },
  { position: "Forward", title: "Forwards" },
  { position: "Center", title: "Centers" },
  { position: null, title: "Position not listed" },
];

/** Stranica kluba: /teams/[code]. Igrači podeljeni po pozicijama, kao na zvaničnom rosteru. */
export default async function TeamPage({ params }: Props) {
  const team = await getTeam((await params).code);
  if (!team) notFound();

  const color = clubColor(team.code);
  const avgPir = averageTeamPir(team);
  const byPosition = (position: Position | null): Player[] =>
    team.players
      .filter((p) => p.position === position)
      .toSorted((a, b) => Number(a.jerseyNumber ?? 999) - Number(b.jerseyNumber ?? 999));

  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <BackLink href="/teams" label="All teams" />

        <section className="grid overflow-hidden rounded-lg bg-paper ring-1 ring-line sm:grid-cols-[260px_1fr]">
          {/* Leva kolona: grb na boji kluba, zakošena desna ivica kao na karticama igrača */}
          <div className="relative flex h-40 items-center justify-center sm:h-auto sm:min-h-[220px]">
            <div
              aria-hidden
              className="absolute inset-0 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] sm:[clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]"
              style={{ backgroundColor: color }}
            />
            {team.crestUrl && (
              <Image
                src={team.crestUrl}
                alt=""
                width={320}
                height={320}
                priority
                className="relative h-28 w-28 object-contain drop-shadow-[0_8px_16px_rgb(0_0_0/0.3)] sm:-ml-6 sm:h-36 sm:w-36"
              />
            )}
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <h1 className="font-display text-5xl leading-[0.9] font-extrabold uppercase sm:text-6xl">
              {team.name}
            </h1>
            <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
              {team.coach && (
                <CoachBlock name={team.coach.name} imageUrl={team.coach.imageUrl} />
              )}
              <dl className="flex gap-8">
                <TeamStat label="Record" value={`${team.wins}–${team.losses}`} />
                <TeamStat label="Players" value={String(team.players.length)} />
                <TeamStat label="Average PIR" value={formatStat(avgPir)} />
              </dl>
            </div>
          </div>
        </section>
      </div>

      {POSITION_GROUPS.map(({ position, title }) => {
        const players = byPosition(position);
        if (players.length === 0) return null;
        return (
          <section key={title} className="space-y-5">
            <h2 className="flex items-baseline gap-3 font-display text-3xl font-extrabold uppercase">
              {title}
              <span className="text-xl font-semibold text-ink-faint">
                {players.length}
              </span>
            </h2>
            <PlayerGrid players={players} from={`/teams/${team.code.toLowerCase()}`} />
          </section>
        );
      })}
    </div>
  );
}

function CoachBlock({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const { first, last } = splitName(name);
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 overflow-hidden rounded-full bg-panel ring-2 ring-paper">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover object-top"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-ink-muted">
            {first[0]}
            {last[0]}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-ink-muted">Head coach</p>
        <p className="leading-tight">
          {first}{" "}
          <span className="font-display text-xl font-extrabold uppercase">{last}</span>
        </p>
      </div>
    </div>
  );
}

function TeamStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-display text-3xl leading-none font-bold">{value}</dd>
    </div>
  );
}
