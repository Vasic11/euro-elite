/**
 * Database schema (Neon Postgres, Drizzle ORM).
 *
 * Keys are the natural codes from the EuroLeague API (club code, person code,
 * season + game code), so the sync can upsert directly by code. We store raw
 * counts only; percentages and averages are computed in lib/stats.
 */
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

/** Set on insert and refreshed by every upsert in the sync. */
const updatedAt = timestamptz("updated_at").notNull().defaultNow();

export const clubs = pgTable("clubs", {
  code: text("code").primaryKey(),
  /** Full name with sponsor; changes between seasons, we keep the latest. */
  name: text("name").notNull(),
  abbreviatedName: text("abbreviated_name"),
  editorialName: text("editorial_name"),
  tvCode: text("tv_code"),
  crestUrl: text("crest_url"),
  updatedAt,
});

/** Players and coaches. The role lives on the roster stint, not on the person. */
export const people = pgTable("people", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  jerseyName: text("jersey_name"),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  heightCm: smallint("height_cm"),
  weightKg: smallint("weight_kg"),
  birthDate: date("birth_date"),
  updatedAt,
});

/**
 * One row per contract between a person and a club in a season. A transfer is
 * two rows for the same person; the current club is the active row with the
 * latest start date.
 */
export const rosterStints = pgTable(
  "roster_stints",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    seasonCode: text("season_code").notNull(),
    clubCode: text("club_code")
      .notNull()
      .references(() => clubs.code),
    personCode: text("person_code")
      .notNull()
      .references(() => people.code),
    /** "J" player, "E" head coach, "A" assistant, as in the API. */
    role: text("role").notNull(),
    startDate: timestamptz("start_date"),
    endDate: timestamptz("end_date"),
    active: boolean("active").notNull(),
    dorsal: text("dorsal"),
    /** 1 = Guard, 2 = Forward, 3 = Center */
    position: smallint("position"),
    imageUrl: text("image_url"),
    updatedAt,
  },
  (t) => [
    // NULLS NOT DISTINCT: without it two NULL start dates count as different
    // keys and every sync would insert a duplicate stint.
    unique("roster_stints_contract_key")
      .on(t.seasonCode, t.clubCode, t.personCode, t.role, t.startDate)
      .nullsNotDistinct(),
    index("roster_stints_person_idx").on(t.personCode, t.startDate),
    index("roster_stints_club_season_idx").on(t.clubCode, t.seasonCode),
  ],
);

export const games = pgTable(
  "games",
  {
    seasonCode: text("season_code").notNull(),
    gameCode: integer("game_code").notNull(),
    round: smallint("round").notNull(),
    /** "RS" regular season, "PO" playoffs, "FF" Final Four. */
    phase: text("phase").notNull(),
    utcDate: timestamptz("utc_date").notNull(),
    homeClubCode: text("home_club_code")
      .notNull()
      .references(() => clubs.code),
    awayClubCode: text("away_club_code")
      .notNull()
      .references(() => clubs.code),
    homeScore: smallint("home_score").notNull(),
    awayScore: smallint("away_score").notNull(),
    /** Points per quarter, then overtimes. */
    homePartials: integer("home_partials").array(),
    awayPartials: integer("away_partials").array(),
    played: boolean("played").notNull(),
    venueName: text("venue_name"),
    audience: integer("audience"),
    /** null = box score not stored yet. Only ever set for played games. */
    boxScoreSyncedAt: timestamptz("box_score_synced_at"),
    updatedAt,
  },
  (t) => [
    primaryKey({ columns: [t.seasonCode, t.gameCode] }),
    index("games_season_date_idx").on(t.seasonCode, t.utcDate),
    index("games_home_club_idx").on(t.homeClubCode),
    index("games_away_club_idx").on(t.awayClubCode),
  ],
);

/**
 * Full box score line per player per game. Players with 0 seconds are stored
 * too (they were in the squad), so averages must filter `seconds > 0`.
 */
export const playerGameStats = pgTable(
  "player_game_stats",
  {
    seasonCode: text("season_code").notNull(),
    gameCode: integer("game_code").notNull(),
    personCode: text("person_code")
      .notNull()
      .references(() => people.code),
    /** The club he played for in this game (matters after a transfer). */
    clubCode: text("club_code")
      .notNull()
      .references(() => clubs.code),
    isHome: boolean("is_home").notNull(),
    started: boolean("started").notNull(),
    dorsal: smallint("dorsal"),
    seconds: integer("seconds").notNull(),
    points: smallint("points").notNull(),
    fg2Made: smallint("fg2_made").notNull(),
    fg2Att: smallint("fg2_att").notNull(),
    fg3Made: smallint("fg3_made").notNull(),
    fg3Att: smallint("fg3_att").notNull(),
    ftMade: smallint("ft_made").notNull(),
    ftAtt: smallint("ft_att").notNull(),
    oreb: smallint("oreb").notNull(),
    dreb: smallint("dreb").notNull(),
    reb: smallint("reb").notNull(),
    ast: smallint("ast").notNull(),
    stl: smallint("stl").notNull(),
    tov: smallint("tov").notNull(),
    blk: smallint("blk").notNull(),
    blkAgainst: smallint("blk_against").notNull(),
    foulsCommitted: smallint("fouls_committed").notNull(),
    foulsDrawn: smallint("fouls_drawn").notNull(),
    plusMinus: smallint("plus_minus").notNull(),
    /** PIR (`valuation` in the API). */
    pir: smallint("pir").notNull(),
    updatedAt,
  },
  (t) => [
    primaryKey({ columns: [t.seasonCode, t.gameCode, t.personCode] }),
    foreignKey({
      name: "player_game_stats_game_fk",
      columns: [t.seasonCode, t.gameCode],
      foreignColumns: [games.seasonCode, games.gameCode],
    }),
    index("player_game_stats_person_idx").on(t.personCode, t.seasonCode),
    index("player_game_stats_club_idx").on(t.clubCode, t.seasonCode),
  ],
);

/** One row per sync run; /api/health will check the latest successful one. */
export const syncRuns = pgTable("sync_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  startedAt: timestamptz("started_at").notNull().defaultNow(),
  finishedAt: timestamptz("finished_at"),
  /** "running" | "ok" | "partial" | "failed" */
  status: text("status").notNull(),
  gamesSynced: integer("games_synced").notNull().default(0),
  boxScoresFailed: integer("box_scores_failed").notNull().default(0),
  error: text("error"),
});

export type ClubRow = typeof clubs.$inferInsert;
export type PersonRow = typeof people.$inferInsert;
export type RosterStintRow = typeof rosterStints.$inferInsert;
export type GameRow = typeof games.$inferInsert;
export type PlayerGameStatsRow = typeof playerGameStats.$inferInsert;
