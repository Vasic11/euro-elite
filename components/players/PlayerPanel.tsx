import Image from "next/image";

import { clubColor } from "@/lib/euroleague/clubColors";
import type { Player } from "@/lib/euroleague/types";

import { PlayerImage } from "./PlayerImage";

/**
 * Foto-ploča: igrač na pozadini u boji svog kluba, sa izbledelim grbom.
 * Ništa ne prolazi kroz igrača; kose linije (ugao parketa) su samo u donjem levom uglu.
 * Koriste je kartice, početna i profil, pa izgled ostaje isti svuda.
 *
 * Hover efekat radi preko "group" klase na roditelju (kartici):
 * linije klize, grb postaje vidljiviji, igrač se blago uvećava.
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
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: clubColor(player.team.code) }}
    >
      {/* Svetlo iz gornjeg desnog ugla i senka pri dnu, da boja ne bude ravna */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_90%_0%,rgb(255_255_255/0.3),transparent_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/30 to-transparent"
      />

      {player.team.crestUrl && (
        <Image
          src={player.team.crestUrl}
          alt=""
          width={hero ? 640 : 320}
          height={hero ? 640 : 320}
          className={`pointer-events-none absolute object-contain opacity-20 transition-opacity duration-500 group-hover:opacity-35 ${
            hero
              ? "-top-8 -right-12 h-[380px] w-[380px]"
              : "-top-4 -right-8 h-[180px] w-[180px]"
          }`}
        />
      )}

      {/* Kose linije u uglu: narandžasta (boja sajta) i bela */}
      <div
        aria-hidden
        className="absolute -bottom-3 left-6 flex [transform:skewX(-24deg)] gap-2 transition-transform duration-500 ease-out group-hover:[transform:skewX(-24deg)_translateX(14px)]"
      >
        <span className={`block bg-accent ${hero ? "h-56 w-5" : "h-32 w-3"}`} />
        <span className={`block bg-white/50 ${hero ? "h-56 w-2" : "h-32 w-1.5"}`} />
      </div>

      {player.jerseyNumber && (
        <span
          aria-hidden
          className={`absolute right-4 bottom-2 font-display leading-none font-extrabold text-transparent ${
            hero ? "text-[8rem]" : "text-6xl"
          }`}
          style={{ WebkitTextStroke: "1.5px rgb(255 255 255 / 0.35)" }}
        >
          {player.jerseyNumber}
        </span>
      )}

      {/* Prostor iznad glave: slika počinje malo ispod vrha ploče */}
      <div className={`absolute inset-x-0 bottom-0 ${hero ? "top-[4%]" : "top-[5%]"}`}>
        <PlayerImage
          src={player.imageUrl}
          name={player.name}
          sizes={sizes}
          priority={priority}
          className="drop-shadow-[0_10px_18px_rgb(0_0_0/0.3)] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>
    </div>
  );
}
