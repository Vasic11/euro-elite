import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { unstable_cache } from "next/cache";

import type { GameBox, RosterEntry, SeasonData } from "@/lib/data/types";
import { DEFAULT_REVALIDATE_SECONDS, SEASON_CODE } from "@/lib/euroleague/config";
import { formatPersonName } from "@/lib/euroleague/format";
import { teamSummary } from "@/lib/euroleague/mappers";
import type { Position } from "@/lib/euroleague/types";
import type { PlayerGameLine } from "@/lib/stats/boxScore";
import { rowToBoxLine, rowToDetailedBoxLine } from "@/lib/sync/rows";

import { getDb } from "./client";
import { clubs, games, people, playerGameStats, rosterStints } from "./schema";

/** Cache tag of everything read from the database; the sync revalidates it. */
export const DB_CACHE_TAG = "db";

/** `roster_stints.position`: 1 = Guard, 2 = Forward, 3 = Center, as in the API. */
const POSITIONS: Record<number, Position> = { 1: "Guard", 2: "Forward", 3: "Center" };

/** Roles the site shows: players and head coaches. */
const SHOWN_ROLES = ["J", "E"];

async function loadClubs() {
  const db = getDb();
  // `clubs` keeps every club ever synced; this season's are the ones with a roster.
  const seasonClubs = db
    .selectDistinct({ code: rosterStints.clubCode })
    .from(rosterStints)
    .where(eq(rosterStints.seasonCode, SEASON_CODE));
  const rows = await db.select().from(clubs).where(inArray(clubs.code, seasonClubs));
  return rows.map(teamSummary);
}

async function loadRoster(): Promise<RosterEntry[]> {
  const rows = await getDb()
    .select({ stint: rosterStints, person: people, club: clubs })
    .from(rosterStints)
    .innerJoin(people, eq(people.code, rosterStints.personCode))
    .innerJoin(clubs, eq(clubs.code, rosterStints.clubCode))
    .where(
      and(
        eq(rosterStints.seasonCode, SEASON_CODE),
        inArray(rosterStints.role, SHOWN_ROLES),
      ),
    );

  return rows.map(({ stint, person, club }) => ({
    role: stint.role,
    active: stint.active,
    startDate: stint.startDate?.getTime() ?? null,
    club: teamSummary(club),
    personCode: person.code,
    name: formatPersonName(person.name),
    // The sync stores what the API sent; "" and 0 mean "unknown" there.
    jerseyNumber: stint.dorsal || null,
    position: stint.position ? (POSITIONS[stint.position] ?? null) : null,
    country: person.countryName,
    heightCm: person.heightCm || null,
    weightKg: person.weightKg || null,
    // Postgres `date` comes back as "1999-09-17"; pages expect the API's form.
    birthDate: person.birthDate ? `${person.birthDate}T00:00:00` : null,
    imageUrl: stint.imageUrl,
  }));
}

async function loadSchedule(): Promise<SeasonData["schedule"]> {
  const home = alias(clubs, "home");
  const away = alias(clubs, "away");
  const rows = await getDb()
    .select({ game: games, home, away })
    .from(games)
    .innerJoin(home, eq(home.code, games.homeClubCode))
    .innerJoin(away, eq(away.code, games.awayClubCode))
    .where(eq(games.seasonCode, SEASON_CODE));

  return rows.map(({ game, home, away }) => ({
    gameCode: game.gameCode,
    round: game.round,
    date: game.utcDate.toISOString(),
    played: game.played,
    home: teamSummary(home),
    away: teamSummary(away),
    homeScore: game.homeScore,
    awayScore: game.awayScore,
  }));
}

/**
 * Every stored box score line, grouped by game. 0-second rows stay in (they
 * mark squad membership for "missed last game"); `averagesFromLines` skips them.
 */
async function loadBoxScores(): Promise<GameBox[]> {
  const rows = await getDb()
    .select()
    .from(playerGameStats)
    .where(eq(playerGameStats.seasonCode, SEASON_CODE));

  const byGame = new Map<number, GameBox>();
  for (const row of rows) {
    let box = byGame.get(row.gameCode);
    if (!box) {
      box = { gameCode: row.gameCode, lines: [] };
      byGame.set(row.gameCode, box);
    }
    box.lines.push(rowToBoxLine(row));
  }
  return [...byGame.values()];
}

async function loadSeasonFromDb(): Promise<SeasonData> {
  const [clubList, roster, schedule, boxes] = await Promise.all([
    loadClubs(),
    loadRoster(),
    loadSchedule(),
    loadBoxScores(),
  ]);
  return { clubs: clubList, roster, schedule, boxes };
}

/**
 * Every game of one player this season, with every box score column, for the
 * stat tables. 0-second rows stay in; `statRow` skips them.
 */
async function loadPlayerGames(personCode: string): Promise<PlayerGameLine[]> {
  const home = alias(clubs, "home");
  const away = alias(clubs, "away");
  const rows = await getDb()
    .select({ stats: playerGameStats, game: games, home, away })
    .from(playerGameStats)
    .innerJoin(
      games,
      and(
        eq(games.seasonCode, playerGameStats.seasonCode),
        eq(games.gameCode, playerGameStats.gameCode),
      ),
    )
    .innerJoin(home, eq(home.code, games.homeClubCode))
    .innerJoin(away, eq(away.code, games.awayClubCode))
    .where(
      and(
        eq(playerGameStats.seasonCode, SEASON_CODE),
        eq(playerGameStats.personCode, personCode),
      ),
    );

  return rows.map(({ stats, game, home, away }) => {
    const isHome = stats.isHome;
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;
    const opponent = isHome ? away : home;
    return {
      gameCode: game.gameCode,
      round: game.round,
      date: game.utcDate.toISOString(),
      team: teamSummary(isHome ? home : away),
      opponent: teamSummary(opponent),
      opponentTvCode: opponent.tvCode || opponent.code,
      isHome,
      teamScore,
      opponentScore,
      won: teamScore > opponentScore,
      line: rowToDetailedBoxLine(stats),
    };
  });
}

/**
 * One small cache entry per player (the code is part of the key), so the
 * detailed columns never land in the season entry and its 2 MB limit. Same tag
 * as the season, so a sync refreshes both.
 */
export const getPlayerGamesFromDb = unstable_cache(
  loadPlayerGames,
  ["player-games", SEASON_CODE],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [DB_CACHE_TAG],
  },
);

/**
 * The whole season from the database as ONE cache entry: ~430 pages render
 * from it without each one querying Neon. Refreshed hourly, and right after
 * every sync via `revalidateTag(DB_CACHE_TAG)`.
 */
export const getSeasonFromDb = unstable_cache(
  loadSeasonFromDb,
  ["season-db", SEASON_CODE],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [DB_CACHE_TAG],
  },
);
