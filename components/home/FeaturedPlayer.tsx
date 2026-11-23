import Link from "next/link";

import { formatStat, splitName } from "@/lib/euroleague/format";
import type { Player } from "@/lib/euroleague/types";
import { PlayerPanel } from "@/components/players/PlayerPanel";

/** Najbolji igrač po PIR-u, velika kartica u hero delu početne. */
export function FeaturedPlayer({ player }: { player: Player }) {
  const { first, last } = splitName(player.name);
  const a = player.averages;

  return (
    <Link
      href={`/players/${player.code}`}
      className="group grid overflow-hidden rounded-lg bg-paper ring-1 ring-line transition-shadow duration-300 hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.4)] hover:ring-accent sm:grid-cols-[1.1fr_1fr] lg:grid-cols-1 xl:grid-cols-[1.1fr_1fr]"
    >
      <div className="relative aspect-square sm:aspect-auto sm:min-h-[340px] lg:aspect-[4/3] xl:aspect-auto">
        <PlayerPanel
          player={player}
          size="hero"
          priority
          sizes="(min-width: 1280px) 30vw, (min-width: 1024px) 45vw, 100vw"
        />
      </div>

      <div className="flex flex-col justify-between gap-6 p-6">
        <div>
          <p className="text-sm font-semibold text-accent-ink">Leads the league in PIR</p>
          <p className="mt-3 text-lg leading-tight text-ink-muted">{first}</p>
          <p className="font-display text-5xl leading-[0.9] font-extrabold uppercase group-hover:text-accent-ink">
            {last}
          </p>
          <p className="mt-2 text-sm text-ink-muted">{player.team.name}</p>
        </div>

        {a && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <BigStat label="PIR" value={a.pir} accent />
            <BigStat label="Points" value={a.points} />
            <BigStat label="Rebounds" value={a.rebounds} />
            <BigStat label="Assists" value={a.assists} />
          </dl>
        )}
      </div>
    </Link>
  );
}

function BigStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse border-t border-line pt-2">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd
        className={`font-display text-4xl leading-none font-bold ${accent ? "text-accent-ink" : ""}`}
      >
        {formatStat(value)}
      </dd>
    </div>
  );
}
