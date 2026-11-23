import Image from "next/image";
import Link from "next/link";

import type { Team } from "@/lib/euroleague/types";

/** Grbovi svih klubova; klik vodi na roster tog kluba na /teams. */
export function ClubStrip({ teams }: { teams: Team[] }) {
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
      {teams.map((team) => (
        <li key={team.code}>
          <Link
            href={`/teams?team=${team.code}#${team.code}`}
            title={team.name}
            className="bg-paper ring-line hover:ring-accent flex aspect-square items-center justify-center rounded-lg p-3 ring-1 transition-shadow"
          >
            {team.crestUrl ? (
              <Image
                src={team.crestUrl}
                alt={team.name}
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="font-display text-lg font-bold">{team.shortName}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
