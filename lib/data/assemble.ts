/**
 * Builds the domain types (Player, Team, Coach) from season data. Pure
 * functions: they do not know whether the data came from the database or the
 * API, so both sources produce the same numbers by construction.
 */
import type { Coach, Player, Team, TeamSummary } from "@/lib/euroleague/types";
import {
  averagesFromLines,
  linesByPlayer,
  playersWhoMissedLastGame,
  teamRecord,
} from "@/lib/stats/aggregate";

import type { RosterEntry, SeasonData } from "./types";

/** Active entries with the given role; after a transfer the latest stint wins. */
export function latestActive(entries: RosterEntry[], role: string): RosterEntry[] {
  const latest = new Map<string, RosterEntry>();
  for (const entry of entries) {
    if (entry.role !== role || !entry.active) continue;
    const existing = latest.get(entry.personCode);
    if (!existing || (entry.startDate ?? -Infinity) > (existing.startDate ?? -Infinity)) {
      latest.set(entry.personCode, entry);
    }
  }
  return [...latest.values()];
}

/**
 * All active players, best PIR first. Averages come from the box scores and
 * only count games where the player got on the court (`averagesFromLines`).
 */
export function buildPlayers({
  roster,
  schedule,
  boxes,
}: Pick<SeasonData, "roster" | "schedule" | "boxes">): Player[] {
  const lines = linesByPlayer(boxes);
  const missed = playersWhoMissedLastGame(schedule, boxes);

  return latestActive(roster, "J")
    .map((entry): Player => ({
      code: entry.personCode,
      name: entry.name,
      jerseyNumber: entry.jerseyNumber,
      position: entry.position,
      country: entry.country,
      heightCm: entry.heightCm,
      weightKg: entry.weightKg,
      birthDate: entry.birthDate,
      imageUrl: entry.imageUrl,
      team: entry.club,
      averages: averagesFromLines(lines.get(entry.personCode) ?? []),
      missedLastGame: missed.has(entry.personCode),
    }))
    .sort(
      (a, b) =>
        (b.averages?.pir ?? -1) - (a.averages?.pir ?? -1) ||
        // Ties (e.g. players who haven't played) by name, not by input order.
        a.name.localeCompare(b.name),
    );
}

/** Head coach of every club, by club code. */
export function buildCoaches(roster: RosterEntry[]): Map<string, Coach> {
  const coaches = new Map<string, Coach>();
  for (const entry of latestActive(roster, "E")) {
    coaches.set(entry.club.code, {
      code: entry.personCode,
      name: entry.name,
      imageUrl: entry.imageUrl,
    });
  }
  return coaches;
}

/** Every club with its players, coach and record, sorted by name. */
export function buildTeams(
  clubs: TeamSummary[],
  players: Player[],
  coaches: Map<string, Coach>,
  schedule: SeasonData["schedule"],
): Team[] {
  return clubs
    .map((club): Team => ({
      ...club,
      players: players.filter((p) => p.team.code === club.code),
      coach: coaches.get(club.code) ?? null,
      ...teamRecord(club.code, schedule),
    }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
}
