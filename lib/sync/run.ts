import "server-only";

import { and, eq, getTableColumns, sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { getDb } from "@/lib/db/client";
import {
  clubs,
  games,
  people,
  playerGameStats,
  rosterStints,
  syncRuns,
} from "@/lib/db/schema";
import { euroleagueFetch } from "@/lib/euroleague/client";
import { COMPETITION_CODE, SEASON_CODE } from "@/lib/euroleague/config";
import { mapLimit } from "@/lib/euroleague/mapLimit";
import {
  clubsResponseSchema,
  syncBoxScoreResponseSchema,
  syncClubPeopleResponseSchema,
  syncScheduleResponseSchema,
} from "@/lib/euroleague/schemas";

import {
  boxScoreRows,
  gamesNeedingBoxScore,
  rosterRows,
  toClubRow,
  toGameRow,
} from "./rows";

const seasonPath = `/competitions/${COMPETITION_CODE}/seasons/${SEASON_CODE}`;

/** The sync must see the API as it is now, never a cached response. */
const FRESH = { revalidate: 0 };

export type SyncStatus = "ok" | "partial" | "failed";

export type SyncResult = {
  runId: number;
  status: SyncStatus;
  clubs: number;
  people: number;
  stints: number;
  games: number;
  boxScoresSynced: number;
  boxScoresFailed: number;
  error?: string;
};

/**
 * `SET col = excluded.col` for every column except the given keys. `excluded`
 * is the row the INSERT tried to write, so an upsert overwrites the stored row
 * with fresh API data. `updated_at` is in it too and gets its default, now().
 */
function setFromExcluded<T extends PgTable>(
  table: T,
  except: string[],
): Record<string, SQL> {
  return Object.fromEntries(
    Object.entries(getTableColumns(table))
      .filter(([key]) => !except.includes(key))
      .map(([key, column]) => [key, sql.raw(`excluded."${column.name}"`)]),
  );
}

/** Error text for the sync_runs table: short, and never a connection string. */
function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]").slice(0, 500);
}

async function syncClubsAndRosters() {
  const db = getDb();
  const clubList = (
    await euroleagueFetch(`/v2${seasonPath}/clubs`, clubsResponseSchema, FRESH)
  ).data;

  await db
    .insert(clubs)
    .values(clubList.map(toClubRow))
    .onConflictDoUpdate({ target: clubs.code, set: setFromExcluded(clubs, ["code"]) });

  const rosters = await mapLimit(clubList, 8, (club) =>
    euroleagueFetch(
      `/v2${seasonPath}/clubs/${encodeURIComponent(club.code)}/people`,
      syncClubPeopleResponseSchema,
      FRESH,
    ),
  );
  const { people: personRows, stints } = rosterRows(SEASON_CODE, rosters.flat());

  // People before stints (foreign key), both in one transaction.
  await db.batch([
    db
      .insert(people)
      .values(personRows)
      .onConflictDoUpdate({
        target: people.code,
        set: setFromExcluded(people, ["code"]),
      }),
    db
      .insert(rosterStints)
      .values(stints)
      .onConflictDoUpdate({
        target: [
          rosterStints.seasonCode,
          rosterStints.clubCode,
          rosterStints.personCode,
          rosterStints.role,
          rosterStints.startDate,
        ],
        set: setFromExcluded(rosterStints, [
          "id",
          "seasonCode",
          "clubCode",
          "personCode",
          "role",
          "startDate",
        ]),
      }),
  ]);

  return { clubs: clubList.length, people: personRows.length, stints: stints.length };
}

async function syncSchedule() {
  const db = getDb();
  const schedule = await euroleagueFetch(
    `/v2${seasonPath}/games`,
    syncScheduleResponseSchema,
    FRESH,
  );
  const rows = schedule.data.map((g) => toGameRow(SEASON_CODE, g));

  await db
    .insert(games)
    .values(rows)
    .onConflictDoUpdate({
      target: [games.seasonCode, games.gameCode],
      // boxScoreSyncedAt is not in the row, so excluded would be null: keep the stored value.
      set: setFromExcluded(games, ["seasonCode", "gameCode", "boxScoreSyncedAt"]),
    });

  return rows.length;
}

/** Fetches and stores one game's box score; true if it was stored. */
async function syncBoxScore(game: {
  gameCode: number;
  homeClubCode: string;
  awayClubCode: string;
}): Promise<boolean> {
  const db = getDb();
  try {
    const box = await euroleagueFetch(
      `/v3${seasonPath}/games/${game.gameCode}/stats`,
      syncBoxScoreResponseSchema,
      FRESH,
    );
    const rows = boxScoreRows(SEASON_CODE, game, box);
    if (rows.stats.length === 0) {
      // A played game without players is not a box score we want to mark as done.
      console.error(`Box score for game ${game.gameCode} has no players`);
      return false;
    }

    // One transaction: people first (so the foreign key holds for a player
    // missing from the rosters; existing rows are left as they are), then the
    // stats, then the mark. The mark also checks `played` in SQL.
    await db.batch([
      db.insert(people).values(rows.people).onConflictDoNothing({ target: people.code }),
      db
        .insert(playerGameStats)
        .values(rows.stats)
        .onConflictDoUpdate({
          target: [
            playerGameStats.seasonCode,
            playerGameStats.gameCode,
            playerGameStats.personCode,
          ],
          set: setFromExcluded(playerGameStats, ["seasonCode", "gameCode", "personCode"]),
        }),
      db
        .update(games)
        .set({ boxScoreSyncedAt: sql`now()` })
        .where(
          and(
            eq(games.seasonCode, SEASON_CODE),
            eq(games.gameCode, game.gameCode),
            eq(games.played, true),
          ),
        ),
    ]);
    return true;
  } catch (error) {
    // Skipped, not fatal: the game stays unsynced and is retried next run.
    console.error(
      `Box score for game ${game.gameCode} failed to sync`,
      describeError(error),
    );
    return false;
  }
}

async function syncBoxScores(now: Date) {
  const db = getDb();
  const stored = await db
    .select({
      gameCode: games.gameCode,
      played: games.played,
      utcDate: games.utcDate,
      boxScoreSyncedAt: games.boxScoreSyncedAt,
      homeClubCode: games.homeClubCode,
      awayClubCode: games.awayClubCode,
    })
    .from(games)
    .where(eq(games.seasonCode, SEASON_CODE));

  const results = await mapLimit(gamesNeedingBoxScore(stored, now), 8, syncBoxScore);
  const synced = results.filter(Boolean).length;
  return { synced, failed: results.length - synced };
}

/**
 * Full sync from the EuroLeague API into the database: clubs, rosters,
 * schedule, then box scores of played games that are missing or recent.
 * Every write is an upsert, so running it twice is harmless.
 */
export async function runSync(now = new Date()): Promise<SyncResult> {
  const db = getDb();
  const [run] = await db
    .insert(syncRuns)
    .values({ status: "running" })
    .returning({ id: syncRuns.id });

  const result: SyncResult = {
    runId: run.id,
    status: "failed",
    clubs: 0,
    people: 0,
    stints: 0,
    games: 0,
    boxScoresSynced: 0,
    boxScoresFailed: 0,
  };

  try {
    Object.assign(result, await syncClubsAndRosters());
    result.games = await syncSchedule();
    const box = await syncBoxScores(now);
    result.boxScoresSynced = box.synced;
    result.boxScoresFailed = box.failed;
    result.status = box.failed === 0 ? "ok" : "partial";
  } catch (error) {
    result.status = "failed";
    result.error = describeError(error);
    console.error("Sync failed", result.error);
  }

  await db
    .update(syncRuns)
    .set({
      status: result.status,
      finishedAt: sql`now()`,
      gamesSynced: result.boxScoresSynced,
      boxScoresFailed: result.boxScoresFailed,
      error: result.error ?? null,
    })
    .where(eq(syncRuns.id, run.id));

  return result;
}
