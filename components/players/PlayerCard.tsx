import Link from "next/link";

import { formatStat, POSITION_SHORT } from "@/lib/euroleague/format";
import type { Player } from "@/lib/euroleague/types";

import { PlayerImage } from "./PlayerImage";

/** Kartica igrača. Ceo blok je link ka profilu, pa radi i "otvori u novom tabu". */
export function PlayerCard({ player }: { player: Player }) {
  const { averages } = player;

  return (
    <Link
      href={`/players/${player.code}`}
      className="group border-euro-border bg-euro-card hover:border-euro-neon/40 relative flex h-[340px] flex-col overflow-hidden rounded-2xl border shadow-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,240,61,0.04)]"
    >
      <div className="border-euro-border-soft bg-euro-bg relative h-48 w-full overflow-hidden border-b">
        <PlayerImage
          src={player.imageUrl}
          name={player.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="opacity-60 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
        />
        <div className="from-euro-card absolute inset-0 bg-gradient-to-t to-transparent opacity-60 transition duration-300 group-hover:opacity-20" />

        {player.position && (
          <span className="bg-euro-surface/90 text-euro-neon absolute top-3 left-3 z-10 rounded-md border border-gray-800 px-2 py-0.5 font-mono text-[9px] font-bold uppercase">
            {POSITION_SHORT[player.position]}
          </span>
        )}
        <span className="bg-euro-bg/90 absolute top-3 right-3 z-10 rounded-lg border border-gray-800 px-2 py-1 text-[11px] font-bold text-white">
          <span className="mr-1 text-[9px] text-gray-500">PIR</span>
          {formatStat(averages?.pir)}
        </span>
      </div>

      <div className="bg-euro-card flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="group-hover:text-euro-neon line-clamp-1 text-base font-bold text-white transition duration-200">
            {player.name}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-gray-500">
            {player.team.shortName}
            {player.jerseyNumber && ` · #${player.jerseyNumber}`}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-gray-800/60 pt-3 font-mono text-xs">
          <span className="font-bold text-gray-400">
            {formatStat(averages?.points)}{" "}
            <span className="text-[9px] text-gray-600">PPG</span>
          </span>
          <span className="font-bold text-gray-400">
            {formatStat(averages?.rebounds)}{" "}
            <span className="text-[9px] text-gray-600">RPG</span>
          </span>
          <span className="text-euro-neon opacity-0 transition duration-300 group-hover:opacity-100">
            ➔
          </span>
        </div>
      </div>
    </Link>
  );
}
