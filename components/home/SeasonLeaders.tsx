import Image from "next/image";
import Link from "next/link";

import { formatStat } from "@/lib/euroleague/format";
import type { Player } from "@/lib/euroleague/types";
import { LEADER_CATEGORIES, leadersFor } from "@/lib/stats/leaders";

/** Top 3 u svakoj kategoriji. Rang je stvarni redosled, pa ima smisla da bude numerisan. */
export function SeasonLeaders({ players }: { players: Player[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {LEADER_CATEGORIES.map((category) => {
        const leaders = leadersFor(players, category.key);
        return (
          <section
            key={category.key}
            className="bg-paper ring-line rounded-lg p-5 ring-1"
          >
            <h3 className="font-display text-xl font-bold">{category.label}</h3>
            <ol className="divide-line mt-3 divide-y">
              {leaders.map((p, i) => (
                <li key={p.code}>
                  <Link
                    href={`/players/${p.code}`}
                    className="group flex items-center gap-3 py-2.5"
                  >
                    <span
                      className={`font-display w-4 text-lg font-bold ${i === 0 ? "text-accent-ink" : "text-ink-faint"}`}
                    >
                      {i + 1}
                    </span>
                    {p.team.crestUrl ? (
                      <Image
                        src={p.team.crestUrl}
                        alt=""
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] object-contain"
                      />
                    ) : (
                      <span className="h-[22px] w-[22px]" />
                    )}
                    <span className="group-hover:text-accent-ink min-w-0 flex-1 truncate text-sm font-semibold">
                      {p.name}
                    </span>
                    <span className="font-display text-xl font-bold">
                      {formatStat(p.averages?.[category.key])}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
