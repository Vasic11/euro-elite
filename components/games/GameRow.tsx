import Image from "next/image";
import Link from "next/link";

import { formatGameDate } from "@/lib/euroleague/format";
import type { TeamSummary } from "@/lib/euroleague/types";
import type { ScheduledGame } from "@/lib/stats/aggregate";

/**
 * Jedna utakmica: datum i kolo, domaćin, rezultat (ili "vs"), gost.
 * Pobednički rezultat je narandžast. `highlight` je kod tima iz čijeg ugla gledamo (podebljan).
 */
export function GameRow({
  game,
  highlight,
  ranks,
}: {
  game: ScheduledGame;
  highlight?: string;
  /** Mesto na tabeli po kodu tima; ako je prosleđeno, prikazuje se "(6)" pored imena. */
  ranks?: Map<string, number>;
}) {
  const homeWon = game.played && game.homeScore > game.awayScore;
  const awayWon = game.played && game.awayScore > game.homeScore;

  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2 rounded-lg bg-paper px-4 py-3 ring-1 ring-line sm:grid-cols-[9rem_1fr_auto_1fr] sm:px-5">
      <div className="col-span-3 text-xs text-ink-muted sm:col-span-1">
        <p className="font-semibold text-ink">{formatGameDate(game.date)}</p>
        <p>Round {game.round}</p>
      </div>

      <TeamCell
        team={game.home}
        align="right"
        bold={game.home.code === highlight}
        rank={ranks?.get(game.home.code)}
      />

      {game.played ? (
        <div className="flex overflow-hidden rounded-md ring-1 ring-line">
          <Score value={game.homeScore} won={homeWon} />
          <Score value={game.awayScore} won={awayWon} />
        </div>
      ) : (
        <span className="w-[5.5rem] text-center font-display text-lg font-bold text-ink-faint">
          vs
        </span>
      )}

      <TeamCell
        team={game.away}
        align="left"
        bold={game.away.code === highlight}
        rank={ranks?.get(game.away.code)}
      />
    </li>
  );
}

function Score({ value, won }: { value: number; won: boolean }) {
  return (
    <span
      className={`w-11 py-1.5 text-center font-display text-xl font-bold sm:w-14 sm:text-2xl ${
        won ? "bg-accent text-ink" : "bg-paper text-ink-muted"
      }`}
    >
      {value}
    </span>
  );
}

function TeamCell({
  team,
  align,
  bold,
  rank,
}: {
  team: TeamSummary;
  align: "left" | "right";
  bold: boolean;
  rank?: number;
}) {
  return (
    <Link
      href={`/teams/${team.code.toLowerCase()}`}
      // Na telefonu je grb iznad imena (centrirano), na širem ekranu pored imena.
      className={`flex min-w-0 flex-col items-center gap-1 text-center hover:text-accent-ink sm:gap-2.5 ${
        align === "right"
          ? "sm:flex-row-reverse sm:text-right"
          : "sm:flex-row sm:text-left"
      }`}
    >
      {team.crestUrl && (
        <Image
          src={team.crestUrl}
          alt=""
          width={64}
          height={64}
          className="h-8 w-8 shrink-0 object-contain"
        />
      )}
      <span className={`min-w-0 leading-tight ${bold ? "font-bold" : "font-medium"}`}>
        {/* Puno ime na širem ekranu, kratko na telefonu */}
        <span className="hidden sm:inline">{team.name}</span>
        <span className="sm:hidden">{team.shortName}</span>
        {rank != null && (
          <span className="ml-1.5 text-sm font-normal text-ink-faint">({rank})</span>
        )}
      </span>
    </Link>
  );
}
