/**
 * Builds the domain types (Player, Team, Coach) from season data. Pure
 * functions: they do not know whether the data came from the database or the
 * API, so both sources produce the same numbers by construction.
 */
import type { Coach, Player, Team, TeamSummary } from "@/lib/euroleague/types";
import {
  averagesFromTotals,
  type PlayerClubTotals,
  playersOutSince,
  playersWhoMissedLastGame,
  teamRecord,
} from "@/lib/stats/aggregate";
import { type CareerStint, careerStints } from "@/lib/stats/career";

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
 * All active players, best PIR first. Averages come from the per-club totals
 * (all clubs of a transferred player together) and only count games where the
 * player got on the court (`averagesFromTotals`).
 */
export function buildPlayers({
  roster,
  totals,
  squads,
}: Pick<SeasonData, "roster" | "totals" | "squads">): Player[] {
  const byPlayer = new Map<string, PlayerClubTotals[]>();
  for (const t of totals) {
    byPlayer.set(t.playerCode, [...(byPlayer.get(t.playerCode) ?? []), t]);
  }
  const current = latestActive(roster, "J");
  const currentClubs = new Map(
    current.map((e) => [e.personCode, { teamCode: e.club.code, since: e.startDate }]),
  );
  const missed = playersWhoMissedLastGame(totals, squads, currentClubs);
  const out = playersOutSince(totals, squads, currentClubs);
  const stintsByPerson = Map.groupBy(roster, (e) => e.personCode);

  return current
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
      averages: averagesFromTotals(byPlayer.get(entry.personCode) ?? []),
      // One badge at a time: a long absence is shown as "Out since", not both.
      missedLastGame: missed.has(entry.personCode) && !out.has(entry.personCode),
      previousClub: previousClub(
        careerStints(stintsByPerson.get(entry.personCode) ?? []),
      ),
      outSince: out.get(entry.personCode) ?? null,
    }))
    .sort(
      (a, b) =>
        (b.averages?.pir ?? -1) - (a.averages?.pir ?? -1) ||
        // Ties (e.g. players who haven't played) by name, not by input order.
        a.name.localeCompare(b.name),
    );
}

/** The club right before the current one, or null without a transfer this season. */
function previousClub(career: CareerStint[]) {
  const i = career.findIndex((s) => s.current);
  return i > 0 ? career[i - 1].club : null;
}

/** This season's clubs of one player for the profile timeline; empty with one club. */
export function buildCareer(roster: RosterEntry[], personCode: string): CareerStint[] {
  return careerStints(roster.filter((e) => e.personCode === personCode));
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
