import Image from "next/image";
import Link from "next/link";

import { formatStat, POSITION_LABEL, splitName } from "@/lib/euroleague/format";
import type { Player } from "@/lib/euroleague/types";

import { PlayerPanel } from "./PlayerPanel";

/** Kartica igrača. Ceo blok je link ka profilu, pa radi i "otvori u novom tabu". */
export function PlayerCard({
  player,
  priority = false,
}: {
  player: Player;
  priority?: boolean;
}) {
  const { averages } = player;
  const { first, last } = splitName(player.name);

  return (
    <Link
      href={`/players/${player.code}`}
      className="group bg-paper ring-line flex h-full flex-col overflow-hidden rounded-lg shadow-[0_1px_0_rgb(0_0_0/0.06)] ring-1 transition-shadow hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.25)]"
    >
      <div className="relative aspect-[4/3.4]">
        <PlayerPanel
          player={player}
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        {averages && (
          <span className="bg-ink font-display absolute top-3 right-3 rounded px-2 py-1 text-sm leading-none font-semibold text-white">
            PIR{" "}
            <span className="text-accent text-lg font-bold">
              {formatStat(averages.pir)}
            </span>
          </span>
        )}
        {player.position && (
          <span className="font-display text-ink absolute bottom-3 left-4 text-sm font-bold">
            {POSITION_LABEL[player.position]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-ink-muted text-sm leading-tight">{first}</p>
          <h3 className="font-display group-hover:text-accent-ink text-2xl leading-tight font-extrabold uppercase">
            {last}
          </h3>
          <p className="text-ink-muted mt-1.5 flex items-center gap-1.5 text-sm">
            {player.team.crestUrl && (
              <Image
                src={player.team.crestUrl}
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] object-contain"
              />
            )}
            {player.team.shortName}
          </p>
        </div>

        <dl className="border-line mt-auto grid grid-cols-3 border-t pt-3">
          <CardStat label="Pts" value={averages?.points} />
          <CardStat label="Reb" value={averages?.rebounds} />
          <CardStat label="Ast" value={averages?.assists} />
        </dl>
      </div>
    </Link>
  );
}

function CardStat({ label, value }: { label: string; value: number | undefined }) {
  return (
    // flex-col-reverse: u HTML-u dt (labela) ide pre dd (vrednosti), a vizuelno je vrednost gore.
    <div className="flex flex-col-reverse">
      <dt className="text-ink-faint mt-1 text-xs">{label}</dt>
      <dd className="font-display text-xl leading-none font-bold">{formatStat(value)}</dd>
    </div>
  );
}
