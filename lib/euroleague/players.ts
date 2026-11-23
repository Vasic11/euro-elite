import "server-only";

import { cache } from "react";

import { euroleagueFetch } from "./client";
import { COMPETITION_CODE, SEASON_CODE } from "./config";
import { formatPersonName } from "./format";
import { toTeamSummary } from "./mappers";
import {
  peopleResponseSchema,
  playerStatsResponseSchema,
  type PersonEntry,
  type PlayerStats,
} from "./schemas";
import type { Player, SeasonAverages, Team } from "./types";

const POSITIONS = ["Guard", "Forward", "Center"] as const;

function toPosition(value: string | null | undefined): Player["position"] {
  return POSITIONS.find((p) => p === value) ?? null;
}

/** Procenat pogodaka: 0 ako nije bilo pokušaja (da ne delimo nulom). */
function percent(made: number, attempted: number): number {
  return attempted > 0 ? (made / attempted) * 100 : 0;
}

function toAverages(s: PlayerStats): SeasonAverages {
  return {
    games: s.gamesPlayed,
    minutes: s.minutesPlayed,
    points: s.pointsScored,
    rebounds: s.totalRebounds,
    assists: s.assists,
    steals: s.steals,
    blocks: s.blocks,
    turnovers: s.turnovers,
    pir: s.pir,
    fieldGoalPct: percent(
      s.twoPointersMade + s.threePointersMade,
      s.twoPointersAttempted + s.threePointersAttempted,
    ),
    threePointPct: percent(s.threePointersMade, s.threePointersAttempted),
    freeThrowPct: percent(s.freeThrowsMade, s.freeThrowsAttempted),
  };
}

function toPlayer(entry: PersonEntry, stats: PlayerStats | undefined): Player {
  return {
    code: entry.person.code,
    name: formatPersonName(entry.person.name),
    jerseyNumber: entry.dorsal || null,
    position: toPosition(entry.positionName),
    country: entry.person.country?.name ?? null,
    heightCm: entry.person.height || null,
    weightKg: entry.person.weight || null,
    birthDate: entry.person.birthDate ?? null,
    imageUrl: entry.images?.headshot ?? stats?.player.imageUrl ?? null,
    team: toTeamSummary(entry.club),
    averages: stats ? toAverages(stats) : null,
  };
}

/**
 * Zaštita od tihog gubitka podataka: ako API vrati manje zapisa nego što sam
 * kaže da postoji, upisujemo grešku u log servera. Ne bacamo izuzetak, jer je
 * bolje prikazati sajt sa skoro svim igračima nego srušiti ceo sajt.
 */
function warnIfIncomplete(what: string, received: number, total: number) {
  if (received < total) {
    console.error(
      `EuroLeague API returned ${received} of ${total} ${what} (paginated response)`,
    );
  }
}

const seasonPath = `/competitions/${COMPETITION_CODE}/seasons/${SEASON_CODE}`;

/**
 * Svi aktivni igrači u sezoni, sortirani po PIR-u.
 *
 * `cache` iz React-a pamti rezultat u okviru jednog renderovanja: ako više
 * komponenti na istoj stranici pozove getPlayers(), posao se radi samo jednom.
 * (Sam HTTP odgovor dodatno kešira Next preko `next.revalidate` u client.ts.)
 */
export const getPlayers = cache(async (): Promise<Player[]> => {
  // Dva zahteva su nezavisna, pa ih šaljemo paralelno.
  const [people, stats] = await Promise.all([
    // personType=J: samo igrači. Bez filtera API vraća i trenere, lekare i ostalo
    // osoblje (~1000 zapisa), a pošto vraća samo jednu stranicu, deo igrača bi ostao
    // van nje (zbog toga je Tubelis falio).
    euroleagueFetch(`/v2${seasonPath}/people`, peopleResponseSchema, {
      query: { personType: "J", limit: 1000 },
    }),
    euroleagueFetch(
      `/v3/competitions/${COMPETITION_CODE}/statistics/players/traditional`,
      playerStatsResponseSchema,
      {
        query: {
          seasonMode: "Single",
          seasonCode: SEASON_CODE,
          statisticMode: "PerGame",
          limit: 1000,
        },
      },
    ),
  ]);

  warnIfIncomplete("people", people.data.length, people.total);
  warnIfIncomplete("player stats", stats.players.length, stats.total);

  // Map po kodu igrača: O(1) pretraga umesto prolaska kroz ceo niz za svakog igrača.
  const statsByCode = new Map(stats.players.map((s) => [s.player.code, s]));

  // Posle transfera igrač može imati dva aktivna zapisa. Zadržavamo novijeg.
  const latestEntry = new Map<string, PersonEntry>();
  for (const entry of people.data) {
    if (entry.type !== "J" || !entry.active) continue;
    const existing = latestEntry.get(entry.person.code);
    if (!existing || (entry.startDate ?? "") > (existing.startDate ?? "")) {
      latestEntry.set(entry.person.code, entry);
    }
  }

  return [...latestEntry.values()]
    .map((entry) => toPlayer(entry, statsByCode.get(entry.person.code)))
    .sort((a, b) => (b.averages?.pir ?? -1) - (a.averages?.pir ?? -1));
});

export async function getPlayer(code: string): Promise<Player | null> {
  const players = await getPlayers();
  return players.find((p) => p.code === code) ?? null;
}

/** Timovi sa svojim igračima, poređani po imenu. */
export async function getTeams(): Promise<Team[]> {
  const players = await getPlayers();
  const byCode = new Map<string, Team>();

  for (const player of players) {
    const team = byCode.get(player.team.code) ?? { ...player.team, players: [] };
    team.players.push(player);
    byCode.set(player.team.code, team);
  }

  return [...byCode.values()].sort((a, b) => a.shortName.localeCompare(b.shortName));
}
