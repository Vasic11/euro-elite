/**
 * Klubovi jednog igrača ove sezone, iz ugovora (`roster_stints`). Čiste funkcije:
 * ugovori ulaze kao epoch ms, pa ne zavise od toga da li su stigli iz baze ili API-ja.
 */
import { formatWithShortMonth } from "@/lib/euroleague/format";
import type { TeamSummary } from "@/lib/euroleague/types";

/** Ono što nam treba iz jednog ugovora (podskup `RosterEntry`). */
export type Stint = {
  role: string;
  active: boolean;
  /** Epoch ms. */
  startDate: number | null;
  /** Epoch ms. */
  endDate: number | null;
  club: TeamSummary;
};

/** Jedan klub na vremenskoj liniji. */
export type CareerStint = {
  club: TeamSummary;
  /** Epoch ms; null kada API ne zna datum početka. */
  from: number | null;
  /** Epoch ms kada je otišao; null za sadašnji klub. */
  to: number | null;
  current: boolean;
};

const startOf = (s: Stint) => s.startDate ?? -Infinity;

/**
 * Klubovi igrača ove sezone, od prvog do sadašnjeg. Prazno ako je bio samo u
 * jednom klubu: tada sekcija "Career this season" ne postoji.
 * - samo ugovori igrača (uloga "J"), po datumu početka (bez datuma ide prvi);
 * - uzastopni ugovori sa istim klubom su jedan red (produžen ugovor nije transfer);
 * - sadašnji je aktivni ugovor sa najkasnijim početkom, isto kao `latestActive`;
 * - kraj bivšeg kluba je `endDate`, a ako fali ili pada posle dolaska u sledeći
 *   klub, dan dolaska u sledeći klub.
 */
export function careerStints(stints: Stint[]): CareerStint[] {
  const own = stints
    .filter((s) => s.role === "J")
    .toSorted(
      (a, b) =>
        startOf(a) - startOf(b) || (a.endDate ?? Infinity) - (b.endDate ?? Infinity),
    );
  if (new Set(own.map((s) => s.club.code)).size < 2) return [];

  const currentStint = own
    .filter((s) => s.active)
    .reduce<Stint | null>(
      // `>=`: sa istim početkom pobeđuje kasniji u nizu, kao i u sortiranju.
      (best, s) => (best === null || startOf(s) >= startOf(best) ? s : best),
      null,
    );

  const merged: (CareerStint & { endDate: number | null })[] = [];
  for (const s of own) {
    const previous = merged.at(-1);
    if (previous?.club.code === s.club.code) {
      previous.endDate = s.endDate ?? previous.endDate;
      previous.current ||= s === currentStint;
      continue;
    }
    merged.push({
      club: s.club,
      from: s.startDate,
      to: null,
      endDate: s.endDate,
      current: s === currentStint,
    });
  }

  return merged.map(({ endDate, ...stint }, i) => {
    if (stint.current) return stint;
    const nextStart = merged[i + 1]?.from ?? null;
    const left =
      endDate === null || (nextStart !== null && endDate > nextStart)
        ? nextStart
        : endDate;
    return { ...stint, to: left };
  });
}

const stintDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  // Datumi ugovora stižu bez zone i upisani su kao UTC (`parseApiDate`); prikaz u
  // UTC-u ne pomera dan (u Beogradu bi ugovor od 16. nov u 23:30 postao 17. nov).
  timeZone: "UTC",
});

/** Epoch ms -> "16 Nov 2026". */
export function formatStintDate(ms: number): string {
  return formatWithShortMonth(stintDateFormat, ms);
}
