import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import { unstable_cache } from "next/cache";

import type {
  PlayerClubTotals,
  RosterEntry,
  ScheduledGame,
  SeasonData,
  TeamSquad,
} from "@/lib/data/types";
import { DEFAULT_REVALIDATE_SECONDS, SEASON_CODE } from "@/lib/euroleague/config";
import { formatPersonName } from "@/lib/euroleague/format";
import { teamSummary } from "@/lib/euroleague/mappers";
import type { Position } from "@/lib/euroleague/types";
import { latestGameByTeam, squadsFrom } from "@/lib/stats/aggregate";
import type { PlayerGameLine } from "@/lib/stats/boxScore";
import { rowToDetailedBoxLine } from "@/lib/sync/rows";

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
    endDate: stint.endDate?.getTime() ?? null,
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

const stats = playerGameStats;
const thisSeason = eq(stats.seasonCode, SEASON_CODE);
const onCourt = sql`${stats.seconds} > 0`;

/** Sum over games he got on the court; `::int` because Postgres sums to bigint (a string in JS). */
const sumOnCourt = (column: AnyPgColumn) =>
  sql<number>`(coalesce(sum(${column}) filter (where ${onCourt}), 0))::int`;

/**
 * Season totals per (player, club) computed in Postgres, so the season entry
 * holds ~one row per player instead of every box score line. Only sums and
 * counts here: the division (averages, percentages) stays in
 * `averagesFromTotals`, so the numbers are the same as from raw lines.
 */
async function loadTotals(): Promise<PlayerClubTotals[]> {
  const rows = await getDb()
    .select({
      playerCode: stats.personCode,
      teamCode: stats.clubCode,
      squadGames: sql<number>`(count(*))::int`,
      games: sql<number>`(count(*) filter (where ${onCourt}))::int`,
      // mapWith: parse it like the column itself (a Date), not as the raw driver string.
      lastSquadDate: sql<Date>`max(${games.utcDate})`.mapWith(games.utcDate),
      seconds: sumOnCourt(stats.seconds),
      points: sumOnCourt(stats.points),
      twoMade: sumOnCourt(stats.fg2Made),
      twoAttempted: sumOnCourt(stats.fg2Att),
      threeMade: sumOnCourt(stats.fg3Made),
      threeAttempted: sumOnCourt(stats.fg3Att),
      ftMade: sumOnCourt(stats.ftMade),
      ftAttempted: sumOnCourt(stats.ftAtt),
      rebounds: sumOnCourt(stats.reb),
      assists: sumOnCourt(stats.ast),
      steals: sumOnCourt(stats.stl),
      blocks: sumOnCourt(stats.blk),
      turnovers: sumOnCourt(stats.tov),
      pir: sumOnCourt(stats.pir),
    })
    .from(stats)
    .innerJoin(
      games,
      and(eq(games.seasonCode, stats.seasonCode), eq(games.gameCode, stats.gameCode)),
    )
    .where(thisSeason)
    .groupBy(stats.personCode, stats.clubCode);
  // Same ISO form as the schedule dates ("…Z"), so the two compare as strings.
  return rows.map((r) => ({ ...r, lastSquadDate: r.lastSquadDate.toISOString() }));
}

/**
 * Per club: games with a box score and the squad of its latest one, for
 * "missed last game". Reads (game, club) pairs, then only the lines of each
 * club's latest game (~20 games), never the whole season of lines.
 */
async function loadSquads(schedule: ScheduledGame[]): Promise<TeamSquad[]> {
  const db = getDb();
  const teamGames = await db
    .selectDistinct({ gameCode: stats.gameCode, teamCode: stats.clubCode })
    .from(stats)
    .where(thisSeason);

  const boxed = new Set(teamGames.map((t) => t.gameCode));
  const lastCodes = [
    ...new Set([...latestGameByTeam(schedule, boxed).values()].map((g) => g.gameCode)),
  ];
  const lastGameLines = lastCodes.length
    ? await db
        .select({
          gameCode: stats.gameCode,
          teamCode: stats.clubCode,
          playerCode: stats.personCode,
        })
        .from(stats)
        .where(and(thisSeason, inArray(stats.gameCode, lastCodes)))
    : [];

  return squadsFrom(schedule, teamGames, lastGameLines);
}

async function loadSeasonFromDb(): Promise<SeasonData> {
  const [clubList, roster, schedule, totals] = await Promise.all([
    loadClubs(),
    loadRoster(),
    loadSchedule(),
    loadTotals(),
  ]);
  // Needs the schedule to find each club's latest game.
  const squads = await loadSquads(schedule);
  return { clubs: clubList, roster, schedule, totals, squads };
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
  // Bumped whenever SeasonData changes shape, so an entry of the old shape is
  // never read after a deploy (v2: totals instead of lines, v3: squad dates,
  // v4: stint end dates and last squad date per player and club).
  ["season-db-v4", SEASON_CODE],
  {
    revalidate: DEFAULT_REVALIDATE_SECONDS,
    tags: [DB_CACHE_TAG],
  },
);
