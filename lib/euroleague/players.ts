import "server-only";

import { cache } from "react";

import {
  averagesFromLines,
  lastGameSquads,
  linesByPlayer,
  teamRecord,
} from "@/lib/stats/aggregate";

import { euroleagueFetch } from "./client";
import { COMPETITION_CODE, SEASON_CODE } from "./config";
import { formatPersonName } from "./format";
import { mapLimit } from "./mapLimit";
import { toTeamSummary } from "./mappers";
import {
  clubPeopleResponseSchema,
  clubsResponseSchema,
  type PersonEntry,
} from "./schemas";
import { getBoxScores, getSchedule } from "./season";
import type { Coach, Player, Team } from "./types";

const POSITIONS = ["Guard", "Forward", "Center"] as const;
const seasonPath = `/competitions/${COMPETITION_CODE}/seasons/${SEASON_CODE}`;

function toPosition(value: string | null | undefined): Player["position"] {
  return POSITIONS.find((p) => p === value) ?? null;
}

/** Klubovi u sezoni. */
const getClubs = cache(async () => {
  const data = await euroleagueFetch(`/v2${seasonPath}/clubs`, clubsResponseSchema);
  return data.data;
});

/**
 * Roster svakog kluba (igrači, treneri, osoblje), klub po klub.
 * Endpoint za celu sezonu vraća samo jednu stranicu rezultata i preskače igrače,
 * pa je 20 manjih zahteva pouzdanije od jednog velikog.
 */
const getRosterEntries = cache(async (): Promise<PersonEntry[]> => {
  const clubs = await getClubs();
  const rosters = await mapLimit(clubs, 8, (club) =>
    euroleagueFetch(
      `/v2${seasonPath}/clubs/${encodeURIComponent(club.code)}/people`,
      clubPeopleResponseSchema,
    ),
  );
  return rosters.flat();
});

/** Aktivni zapisi datog tipa; posle transfera zadržava se najnoviji zapis osobe. */
function latestActive(entries: PersonEntry[], type: string): PersonEntry[] {
  const latest = new Map<string, PersonEntry>();
  for (const entry of entries) {
    if (entry.type !== type || !entry.active) continue;
    const existing = latest.get(entry.person.code);
    if (!existing || (entry.startDate ?? "") > (existing.startDate ?? "")) {
      latest.set(entry.person.code, entry);
    }
  }
  return [...latest.values()];
}

/**
 * Svi aktivni igrači, sortirani po PIR-u.
 * Proseke računamo sami iz box score-ova odigranih utakmica.
 *
 * `cache` iz React-a pamti rezultat u okviru jednog renderovanja, pa se ovaj posao
 * radi jednom po stranici, koliko god je komponenti pozivalo.
 */
export const getPlayers = cache(async (): Promise<Player[]> => {
  const [entries, schedule, boxes] = await Promise.all([
    getRosterEntries(),
    getSchedule(),
    getBoxScores(),
  ]);

  const lines = linesByPlayer(boxes);
  const squads = lastGameSquads(schedule, boxes);

  return latestActive(entries, "J")
    .map((entry): Player => {
      const squad = squads.get(entry.club.code);
      return {
        code: entry.person.code,
        name: formatPersonName(entry.person.name),
        jerseyNumber: entry.dorsal || null,
        position: toPosition(entry.positionName),
        country: entry.person.country?.name ?? null,
        heightCm: entry.person.height || null,
        weightKg: entry.person.weight || null,
        birthDate: entry.person.birthDate ?? null,
        imageUrl: entry.images?.headshot ?? null,
        team: toTeamSummary(entry.club),
        averages: averagesFromLines(lines.get(entry.person.code) ?? []),
        // Ako tim još nije igrao, nemamo sa čim da poredimo.
        missedLastGame: squad ? !squad.has(entry.person.code) : false,
      };
    })
    .sort((a, b) => (b.averages?.pir ?? -1) - (a.averages?.pir ?? -1));
});

export async function getPlayer(code: string): Promise<Player | null> {
  const players = await getPlayers();
  return players.find((p) => p.code === code) ?? null;
}

/** Glavni trener svakog kluba, po kodu kluba. */
const getCoaches = cache(async (): Promise<Map<string, Coach>> => {
  const entries = await getRosterEntries();
  const coaches = new Map<string, Coach>();
  for (const entry of latestActive(entries, "E")) {
    coaches.set(entry.club.code, {
      code: entry.person.code,
      name: formatPersonName(entry.person.name),
      imageUrl: entry.images?.headshot ?? null,
    });
  }
  return coaches;
});

/** Svi klubovi sa igračima, trenerom i učinkom, poređani po imenu. */
export const getTeams = cache(async (): Promise<Team[]> => {
  const [clubs, players, coaches, schedule] = await Promise.all([
    getClubs(),
    getPlayers(),
    getCoaches(),
    getSchedule(),
  ]);

  return clubs
    .map((club): Team => ({
      ...toTeamSummary(club),
      players: players.filter((p) => p.team.code === club.code),
      coach: coaches.get(club.code) ?? null,
      ...teamRecord(club.code, schedule),
    }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
});

export async function getTeam(code: string): Promise<Team | null> {
  const teams = await getTeams();
  return teams.find((t) => t.code.toLowerCase() === code.toLowerCase()) ?? null;
}
