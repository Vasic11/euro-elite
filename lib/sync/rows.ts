/**
 * Mapping from EuroLeague API shapes (Zod DTOs) to database rows, plus the
 * rules that decide what the sync fetches. Pure functions: no fetch, no DB,
 * so every rule here has a test in rows.test.ts.
 */
import type {
  ClubRow,
  GameRow,
  PersonRow,
  PlayerGameStatsRow,
  RosterStintRow,
} from "@/lib/db/schema";
import type {
  Club,
  PersonEntry,
  SyncBoxScoreDto,
  SyncPersonEntryDto,
  SyncScheduleGameDto,
} from "@/lib/euroleague/schemas";
import type { BoxLine } from "@/lib/stats/aggregate";
import type { DetailedBoxLine } from "@/lib/stats/boxScore";

/** How many days back the sync re-fetches box scores, in case the league corrects stats. */
export const RECENT_BOX_SCORE_DAYS = 3;

/**
 * API timestamps come in two forms: `utcDate` ends in "Z", while roster
 * `startDate`/`endDate` have no zone ("2026-09-04T13:10:29.86"). We treat the
 * zoneless ones as UTC so the stored value never depends on the server's zone.
 */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "1997-09-02T00:00:00" -> "1997-09-02" for a Postgres `date` column. */
function toDateOnly(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null;
}

export function toClubRow(club: Club): ClubRow {
  return {
    code: club.code,
    name: club.name,
    abbreviatedName: club.abbreviatedName ?? null,
    editorialName: club.editorialName ?? null,
    tvCode: club.tvCode ?? null,
    crestUrl: club.images?.crest ?? null,
  };
}

export function toPersonRow(person: PersonEntry["person"]): PersonRow {
  return {
    code: person.code,
    name: person.name,
    jerseyName: person.jerseyName ?? null,
    countryCode: person.country?.code ?? null,
    countryName: person.country?.name ?? null,
    heightCm: person.height ?? null,
    weightKg: person.weight ?? null,
    birthDate: toDateOnly(person.birthDate),
  };
}

export function toStintRow(
  seasonCode: string,
  entry: SyncPersonEntryDto,
): RosterStintRow {
  return {
    seasonCode,
    clubCode: entry.club.code,
    personCode: entry.person.code,
    role: entry.type,
    startDate: parseApiDate(entry.startDate),
    endDate: parseApiDate(entry.endDate),
    active: entry.active,
    dorsal: entry.dorsal ?? null,
    position: entry.position ?? null,
    imageUrl: entry.images?.headshot ?? null,
  };
}

/**
 * Keeps one row per key, the last one wins. Postgres rejects an
 * `INSERT ... ON CONFLICT DO UPDATE` that touches the same row twice in one
 * statement, and a transferred player shows up in two clubs' rosters.
 */
export function uniqueBy<T>(rows: T[], key: (row: T) => string): T[] {
  return [...new Map(rows.map((row) => [key(row), row])).values()];
}

/** Unique key of a stint, matching the `roster_stints_contract_key` constraint. */
export function stintKey(row: RosterStintRow): string {
  return [
    row.seasonCode,
    row.clubCode,
    row.personCode,
    row.role,
    row.startDate?.toISOString() ?? "null",
  ].join("|");
}

/** People and stints from all club rosters, deduplicated for one upsert each. */
export function rosterRows(
  seasonCode: string,
  entries: SyncPersonEntryDto[],
): { people: PersonRow[]; stints: RosterStintRow[] } {
  return {
    people: uniqueBy(
      entries.map((e) => toPersonRow(e.person)),
      (p) => p.code,
    ),
    stints: uniqueBy(
      entries.map((e) => toStintRow(seasonCode, e)),
      stintKey,
    ),
  };
}

type Partials = SyncScheduleGameDto["local"]["partials"];

/** [q1, q2, q3, q4, ot1, ot2, ...]; null if the API has no partials. */
export function partialsToArray(partials: Partials): number[] | null {
  if (!partials) return null;
  const overtimes = Object.entries(partials.extraPeriods ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, points]) => points);
  return [
    partials.partials1,
    partials.partials2,
    partials.partials3,
    partials.partials4,
    ...overtimes,
  ];
}

/** A schedule row. `boxScoreSyncedAt` is left out so an upsert never resets it. */
export function toGameRow(seasonCode: string, game: SyncScheduleGameDto): GameRow {
  const utcDate = parseApiDate(game.utcDate);
  if (!utcDate) throw new Error(`Game ${game.gameCode} has an invalid utcDate`);
  return {
    seasonCode,
    gameCode: game.gameCode,
    round: game.round,
    phase: game.phaseType.code,
    utcDate,
    homeClubCode: game.local.club.code,
    awayClubCode: game.road.club.code,
    homeScore: game.local.score,
    awayScore: game.road.score,
    homePartials: partialsToArray(game.local.partials),
    awayPartials: partialsToArray(game.road.partials),
    played: game.played,
    venueName: game.venue?.name ?? null,
    audience: game.audience ?? null,
  };
}

/** What the sync needs to know about a stored game to decide on its box score. */
export type GameSyncState = {
  gameCode: number;
  played: boolean;
  utcDate: Date;
  boxScoreSyncedAt: Date | null;
};

/**
 * Games whose box score the sync should fetch now: only played games, either
 * never synced or played in the last `RECENT_BOX_SCORE_DAYS` days. A game that
 * is not `played` is never fetched or marked, even if the API already serves a
 * partial box score while it is in progress.
 */
export function gamesNeedingBoxScore<T extends GameSyncState>(
  games: T[],
  now: Date,
): T[] {
  const recentFrom = now.getTime() - RECENT_BOX_SCORE_DAYS * 24 * 60 * 60 * 1000;
  return games.filter(
    (g) => g.played && (g.boxScoreSyncedAt === null || g.utcDate.getTime() >= recentFrom),
  );
}

type BoxSide = SyncBoxScoreDto["local"];

function sideStats(
  side: BoxSide,
  base: { seasonCode: string; gameCode: number; clubCode: string; isHome: boolean },
): PlayerGameStatsRow[] {
  return side.players.map(({ player, stats: s }) => ({
    ...base,
    personCode: player.person.code,
    started: s.startFive ?? false,
    dorsal: s.dorsal ?? null,
    seconds: s.timePlayed,
    points: s.points,
    fg2Made: s.fieldGoalsMade2,
    fg2Att: s.fieldGoalsAttempted2,
    fg3Made: s.fieldGoalsMade3,
    fg3Att: s.fieldGoalsAttempted3,
    ftMade: s.freeThrowsMade,
    ftAtt: s.freeThrowsAttempted,
    oreb: s.offensiveRebounds,
    dreb: s.defensiveRebounds,
    reb: s.totalRebounds,
    ast: s.assistances,
    stl: s.steals,
    tov: s.turnovers,
    blk: s.blocksFavour,
    blkAgainst: s.blocksAgainst,
    foulsCommitted: s.foulsCommited,
    foulsDrawn: s.foulsReceived,
    plusMinus: s.plusMinus,
    pir: s.valuation,
  }));
}

/**
 * Rows for one game's box score: the people in it (upserted first, so the
 * foreign key holds even for a player missing from the rosters) and one stats
 * row per player, including players with 0 seconds.
 */
export function boxScoreRows(
  seasonCode: string,
  game: { gameCode: number; homeClubCode: string; awayClubCode: string },
  box: SyncBoxScoreDto,
): { people: PersonRow[]; stats: PlayerGameStatsRow[] } {
  const base = { seasonCode, gameCode: game.gameCode };
  const stats = [
    ...sideStats(box.local, { ...base, clubCode: game.homeClubCode, isHome: true }),
    ...sideStats(box.road, { ...base, clubCode: game.awayClubCode, isHome: false }),
  ];
  const people = [...box.local.players, ...box.road.players].map((p) =>
    toPersonRow(p.player.person),
  );
  return {
    people: uniqueBy(people, (p) => p.code),
    stats: uniqueBy(stats, (s) => s.personCode),
  };
}

/** The stats columns `rowToBoxLine` reads; a full DB row satisfies it. */
export type StoredStatsLine = Pick<
  PlayerGameStatsRow,
  | "personCode"
  | "clubCode"
  | "started"
  | "seconds"
  | "points"
  | "fg2Made"
  | "fg2Att"
  | "fg3Made"
  | "fg3Att"
  | "ftMade"
  | "ftAtt"
  | "reb"
  | "ast"
  | "stl"
  | "blk"
  | "tov"
  | "pir"
>;

/**
 * A stored stats row as the `BoxLine` that lib/stats works with, so averages
 * from the database go through the same `averagesFromLines` (which only counts
 * games with seconds > 0) as averages from the API do today.
 */
export function rowToBoxLine(row: StoredStatsLine): BoxLine {
  return {
    playerCode: row.personCode,
    teamCode: row.clubCode,
    started: row.started,
    seconds: row.seconds,
    points: row.points,
    twoMade: row.fg2Made,
    twoAttempted: row.fg2Att,
    threeMade: row.fg3Made,
    threeAttempted: row.fg3Att,
    ftMade: row.ftMade,
    ftAttempted: row.ftAtt,
    rebounds: row.reb,
    assists: row.ast,
    steals: row.stl,
    blocks: row.blk,
    turnovers: row.tov,
    pir: row.pir,
  };
}

/** The extra columns the stat tables read on top of `StoredStatsLine`. */
export type StoredDetailedStatsLine = StoredStatsLine &
  Pick<
    PlayerGameStatsRow,
    "oreb" | "dreb" | "blkAgainst" | "foulsCommitted" | "foulsDrawn" | "plusMinus"
  >;

/**
 * A stored stats row with every box score column, for the player stat tables.
 * Separate from `rowToBoxLine` so the season cache entry does not grow (see
 * "Known risks" in docs/HISTORY.md).
 */
export function rowToDetailedBoxLine(row: StoredDetailedStatsLine): DetailedBoxLine {
  return {
    ...rowToBoxLine(row),
    offRebounds: row.oreb,
    defRebounds: row.dreb,
    blocksAgainst: row.blkAgainst,
    foulsCommitted: row.foulsCommitted,
    foulsDrawn: row.foulsDrawn,
    plusMinus: row.plusMinus,
  };
}
