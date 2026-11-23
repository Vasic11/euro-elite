import Image from "next/image";
import Link from "next/link";

import { clubColor } from "@/lib/euroleague/clubColors";
import type { Team } from "@/lib/euroleague/types";

/**
 * Grbovi svih klubova. Podrazumevano su sivi i utišani, a na hover (ili fokus)
 * dobiju boju, podignu se i dobiju ivicu u boji kluba. Klik otvara roster na /teams.
 */
export function ClubStrip({ teams }: { teams: Team[] }) {
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
      {teams.map((team) => (
        <li key={team.code}>
          <Link
            href={`/teams?team=${team.code}#${team.code}`}
            title={team.name}
            style={{ "--club": clubColor(team.code) } as React.CSSProperties}
            className="group flex aspect-square items-center justify-center rounded-lg bg-paper p-3 ring-1 ring-line transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_28px_-16px_rgb(0_0_0/0.4)] hover:ring-2 hover:ring-[var(--club)] focus-visible:-translate-y-1"
          >
            {team.crestUrl ? (
              <Image
                src={team.crestUrl}
                alt={team.name}
                width={160}
                height={160}
                sizes="(min-width: 1024px) 10vw, 25vw"
                className="h-full w-full object-contain opacity-60 grayscale transition duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
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
