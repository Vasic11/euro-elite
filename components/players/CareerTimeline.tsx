import Image from "next/image";
import Link from "next/link";

import { type CareerStint, formatStintDate } from "@/lib/stats/career";

/** "12 Aug 2026 – 16 Nov 2026", or "Since 16 Nov 2026" for the current club. */
function period({ from, to, current }: CareerStint): string {
  const start = from === null ? null : formatStintDate(from);
  if (current) return start ? `Since ${start}` : "Current club";
  return `${start ?? "Start of season"} – ${to === null ? "unknown" : formatStintDate(to)}`;
}

/**
 * Klubovi igrača ove sezone, od prvog do sadašnjeg, povezani narandžastom
 * linijom transfera. Uspravno na telefonu, vodoravno od `sm`. Stranica je
 * prikazuje samo kada je igrač promenio klub (`career.length > 1`).
 */
export function CareerTimeline({ career }: { career: CareerStint[] }) {
  return (
    <section
      aria-labelledby="career-heading"
      className="rounded-lg bg-paper p-6 ring-1 ring-line sm:p-8"
    >
      <h2 id="career-heading" className="font-display text-2xl font-extrabold uppercase">
        Career this season
      </h2>

      <ol className="mt-6 flex flex-col gap-6 sm:flex-row sm:gap-0">
        {career.map((stint, i) => (
          <li
            key={`${stint.club.code}-${stint.from ?? i}`}
            className="relative flex gap-4 sm:flex-1 sm:flex-col sm:gap-3"
          >
            {/* Linija do sledećeg kluba: niz levu ivicu na telefonu, desno od grba od sm. */}
            {i < career.length - 1 && (
              <span
                aria-hidden
                className="absolute top-14 -bottom-6 left-7 w-0.5 -translate-x-1/2 bg-accent sm:top-7 sm:right-0 sm:bottom-auto sm:left-16 sm:h-0.5 sm:w-auto sm:translate-x-0 sm:-translate-y-1/2"
              />
            )}

            <span
              className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-paper ${
                stint.current ? "ring-2 ring-accent" : "ring-1 ring-line"
              }`}
            >
              {stint.club.crestUrl ? (
                <Image
                  src={stint.club.crestUrl}
                  alt=""
                  width={72}
                  height={72}
                  className="h-9 w-9 object-contain"
                />
              ) : (
                <span className="font-display font-bold">{stint.club.code}</span>
              )}
            </span>

            <div className="min-w-0 sm:pr-6">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/teams/${stint.club.code.toLowerCase()}`}
                  className="font-display text-xl leading-tight font-bold hover:text-accent-ink hover:underline"
                >
                  {stint.club.name}
                </Link>
                {stint.current && (
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 font-display text-sm leading-none font-bold text-accent-ink">
                    Current
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{period(stint)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
