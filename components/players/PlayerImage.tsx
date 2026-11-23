import Image from "next/image";

import { splitName } from "@/lib/euroleague/format";

/**
 * Slika igrača preko next/image (automatski smanjuje i kešira slike).
 * Slike iz API-ja su isečene figure sa providnom pozadinom, ali sa različito
 * mnogo praznog prostora na dnu. Zato sliku popunjavamo od vrha (object-cover,
 * object-top): igrač uvek dodiruje dno ploče, a višak se odseca ispod kadra.
 * Ako slike nema, prikazujemo inicijale.
 */
export function PlayerImage({
  src,
  name,
  sizes,
  className = "",
  priority = false,
}: {
  src: string | null;
  name: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    const { first, last } = splitName(name);
    return (
      <div
        className="absolute inset-0 flex items-end justify-center pb-6"
        aria-label={name}
        role="img"
      >
        <span className="font-display text-6xl font-extrabold text-white/40">
          {first[0]}
          {last[0]}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover object-top ${className}`}
    />
  );
}
