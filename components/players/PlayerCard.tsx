import Image from "next/image";
import Link from "next/link";

import { formatStat, POSITION_LABEL, splitName } from "@/lib/euroleague/format";
import type { Player } from "@/lib/euroleague/types";

import { MissedGameBadge } from "./MissedGameBadge";
import { PlayerPanel } from "./PlayerPanel";

/** Link ka profilu; `from` je stranica sa koje se dolazi, da dugme za povratak vodi tamo. */
export function playerHref(code: string, from?: string) {
  return from ? `/players/${code}?from=${encodeURIComponent(from)}` : `/players/${code}`;
}

/** Kartica igrača. Ceo blok je link ka profilu, pa radi i "otvori u novom tabu". */
export function PlayerCard({
  player,
  priority = false,
  from,
}: {
  player: Player;
  priority?: boolean;
  from?: string;
}) {
  const { averages } = player;
  const { first, last } = splitName(player.name);

  return (
    <Link
      href={playerHref(player.code, from)}
      className="group flex h-full flex-col overflow-hidden rounded-lg bg-paper ring-1 ring-line transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgb(0_0_0/0.35)] hover:ring-accent focus-visible:-translate-y-1"
    >
      <div className="relative aspect-[4/3.4]">
        <PlayerPanel
          player={player}
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        {averages && (
          <span className="absolute top-3 right-3 rounded bg-ink px-2 py-1 font-display text-sm leading-none font-semibold text-white">
            PIR{" "}
            <span className="text-lg font-bold text-accent">
              {formatStat(averages.pir)}
            </span>
          </span>
        )}
        {player.missedLastGame && <MissedGameBadge className="absolute top-3 left-3" />}
        {player.position && (
          <span className="absolute bottom-3 left-3 rounded bg-paper/90 px-2 py-0.5 font-display text-sm font-bold text-ink">
            {POSITION_LABEL[player.position]}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-sm leading-tight text-ink-muted">{first}</p>
          <h3 className="font-display text-2xl leading-tight font-extrabold uppercase group-hover:text-accent-ink">
            {last}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
            {player.team.crestUrl && (
              <Image
                src={player.team.crestUrl}
                alt=""
                width={36}
                height={36}
                className="h-[18px] w-[18px] object-contain"
              />
            )}
            {player.team.shortName}
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-3 border-t border-line pt-3">
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
      <dt className="mt-1 text-xs text-ink-faint">{label}</dt>
      <dd className="font-display text-xl leading-none font-bold">{formatStat(value)}</dd>
    </div>
  );
}
