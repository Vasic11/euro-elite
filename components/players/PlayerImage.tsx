import Image from "next/image";

/**
 * Slika igrača preko next/image (automatski smanjuje i kešira slike).
 * Ako igrač nema sliku u API-ju, prikazujemo inicijale umesto tuđe stock fotografije.
 */
export function PlayerImage({
  src,
  name,
  sizes,
  className = "",
}: {
  src: string | null;
  name: string;
  sizes: string;
  className?: string;
}) {
  if (!src) {
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("");
    return (
      <div className="bg-euro-surface flex h-full w-full items-center justify-center font-mono text-4xl font-black text-gray-600">
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={sizes}
      className={`object-cover object-top ${className}`}
    />
  );
}
