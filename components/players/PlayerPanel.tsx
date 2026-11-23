import Image from "next/image";

import { clubColor } from "@/lib/euroleague/clubColors";
import type { Player } from "@/lib/euroleague/types";

import { PlayerImage } from "./PlayerImage";

/**
 * Foto-ploča: igrač ispred kose trake u boji svog kluba, sa velikim izbledelim grbom.
 * Koriste je kartice, početna i profil, pa izgled ostaje isti svuda.
 *
 * Hover efekat radi preko "group" klase na roditelju (kartici):
 * traka se širi, grb postaje vidljiviji, igrač se blago uvećava.
 */
export function PlayerPanel({
  player,
  sizes,
  size = "card",
  priority = false,
}: {
  player: Player;
  sizes: string;
  size?: "card" | "hero";
  priority?: boolean;
}) {
  const hero = size === "hero";
  const color = clubColor(player.team.code);

  return (
    <div className="relative h-full w-full overflow-hidden bg-panel">
      {/* Kosa traka u boji kluba. clip-path sa istim brojem tačaka može da se animira. */}
      <div
        aria-hidden
        className="absolute inset-0 transition-[clip-path] duration-500 ease-out [clip-path:polygon(0_0,58%_0,34%_100%,0_100%)] group-hover:[clip-path:polygon(0_0,72%_0,48%_100%,0_100%)]"
        style={{ backgroundColor: color }}
      />
      {/* Tanka narandžasta linija uz ivicu trake: veza sa bojom sajta */}
      <div
        aria-hidden
        className="absolute inset-0 bg-accent transition-[clip-path] duration-500 ease-out [clip-path:polygon(58%_0,61%_0,37%_100%,34%_100%)] group-hover:[clip-path:polygon(72%_0,75%_0,51%_100%,48%_100%)]"
      />

      {player.team.crestUrl && (
        <Image
          src={player.team.crestUrl}
          alt=""
          width={hero ? 640 : 320}
          height={hero ? 640 : 320}
          className={`pointer-events-none absolute object-contain opacity-[0.18] transition-opacity duration-500 group-hover:opacity-30 ${
            hero
              ? "-top-8 -right-12 h-[380px] w-[380px]"
              : "-top-4 -right-8 h-[180px] w-[180px]"
          }`}
        />
      )}

      {player.jerseyNumber && (
        <span
          aria-hidden
          className={`absolute right-4 bottom-2 font-display leading-none font-extrabold text-transparent ${
            hero ? "text-[8rem]" : "text-6xl"
          }`}
          style={{ WebkitTextStroke: "1.5px rgb(0 0 0 / 0.14)" }}
        >
          {player.jerseyNumber}
        </span>
      )}

      <PlayerImage
        src={player.imageUrl}
        name={player.name}
        sizes={sizes}
        priority={priority}
        className="drop-shadow-[0_8px_16px_rgb(0_0_0/0.18)] transition-transform duration-500 ease-out group-hover:scale-[1.05]"
      />
    </div>
  );
}
