import Image from "next/image";
import Link from "next/link";

import { clubColor } from "@/lib/euroleague/clubColors";
import type { Team } from "@/lib/euroleague/types";

/** Kartica kluba na /teams: grb na traci u boji kluba, trener i učinak. */
export function TeamCard({ team }: { team: Team }) {
  const color = clubColor(team.code);
  const missing = team.players.filter((p) => p.missedLastGame).length;

  return (
    <Link
      href={`/teams/${team.code.toLowerCase()}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-paper ring-1 ring-line transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgb(0_0_0/0.35)] hover:ring-accent focus-visible:-translate-y-1"
    >
      <div className="relative h-32 overflow-hidden bg-panel">
        <div
          aria-hidden
          className="absolute inset-0 transition-[clip-path] duration-500 ease-out [clip-path:polygon(0_0,52%_0,36%_100%,0_100%)] group-hover:[clip-path:polygon(0_0,66%_0,50%_100%,0_100%)]"
          style={{ backgroundColor: color }}
        />
        {team.crestUrl && (
          <Image
            src={team.crestUrl}
            alt=""
            width={192}
            height={192}
            className="absolute top-1/2 right-6 h-24 w-24 -translate-y-1/2 object-contain drop-shadow-[0_6px_12px_rgb(0_0_0/0.2)] transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="font-display text-2xl leading-tight font-extrabold uppercase group-hover:text-accent-ink">
          {team.shortName}
        </h2>
        <p className="text-sm text-ink-muted">
          {team.coach ? `Head coach ${team.coach.name}` : "Head coach not listed"}
        </p>
        <dl className="mt-auto grid grid-cols-2 border-t border-line pt-3">
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-ink-faint">Record</dt>
            <dd className="font-display text-xl font-bold">
              {team.wins}–{team.losses}
            </dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs text-ink-faint">Players</dt>
            <dd className="font-display text-xl font-bold">{team.players.length}</dd>
          </div>
        </dl>
        {missing > 0 && (
          <p className="-mt-1 text-sm font-semibold text-[#c62828]">
            {missing} {missing === 1 ? "player" : "players"} missed the last game
          </p>
        )}
      </div>
    </Link>
  );
}
