import Image from "next/image";

import type { Player } from "@/lib/euroleague/types";

import { PlayerImage } from "./PlayerImage";

/**
 * Foto-ploča: igrač ispred velikog izbledelog grba svog kluba,
 * sa narandžastom dijagonalom (ugao parketa) i brojem dresa.
 * Koriste je i kartica i profil, pa izgled ostaje isti svuda.
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

  return (
    <div className="bg-panel relative h-full w-full overflow-hidden">
      {player.team.crestUrl && (
        <Image
          src={player.team.crestUrl}
          alt=""
          width={hero ? 420 : 220}
          height={hero ? 420 : 220}
          className={`pointer-events-none absolute object-contain opacity-[0.13] grayscale ${
            hero
              ? "-top-10 -right-16 h-[420px] w-[420px]"
              : "-top-6 -right-10 h-[200px] w-[200px]"
          }`}
        />
      )}

      {/* Narandžasta dijagonala: isti zakošeni ugao kao u logou */}
      <div
        aria-hidden
        className="bg-accent absolute inset-x-0 bottom-0"
        style={{
          height: hero ? "38%" : "34%",
          clipPath: "polygon(0 45%, 100% 0, 100% 100%, 0 100%)",
        }}
      />

      {player.jerseyNumber && (
        <span
          aria-hidden
          className={`font-display absolute leading-none font-extrabold text-transparent ${
            hero ? "top-5 left-6 text-[9rem]" : "top-3 left-4 text-7xl"
          }`}
          style={{ WebkitTextStroke: "1.5px rgb(0 0 0 / 0.16)" }}
        >
          {player.jerseyNumber}
        </span>
      )}

      <PlayerImage
        src={player.imageUrl}
        name={player.name}
        sizes={sizes}
        priority={priority}
        className="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      />
    </div>
  );
}
