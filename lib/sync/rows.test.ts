import { describe, expect, it } from "vitest";

import type { PlayerGameStatsRow } from "@/lib/db/schema";
import type {
  SyncBoxScoreDto,
  SyncPersonEntryDto,
  SyncScheduleGameDto,
} from "@/lib/euroleague/schemas";
import { averagesFromLines } from "@/lib/stats/aggregate";

import {
  boxScoreRows,
  gamesNeedingBoxScore,
  type GameSyncState,
  parseApiDate,
  partialsToArray,
  rosterRows,
  rowToBoxLine,
  toGameRow,
} from "./rows";

const SEASON = "E2026";

const club = (code: string) => ({ code, name: `${code} full name` });

function person(code: string): SyncPersonEntryDto["person"] {
  return {
    code,
    name: `PLAYER, ${code}`,
    jerseyName: null,
    country: { code: "SRB", name: "Serbia" },
    height: 200,
    weight: 95,
    birthDate: "1997-09-02T00:00:00",
  };
}

function entry(
  code: string,
  clubCode: string,
  over: Partial<SyncPersonEntryDto> = {},
): SyncPersonEntryDto {
  return {
    type: "J",
    active: true,
    startDate: "2026-09-04T13:10:29.86",
    endDate: "2027-06-30T00:00:00",
    dorsal: "7",
    position: 1,
    images: { headshot: `https://img/${code}.png` },
    person: person(code),
    club: club(clubCode),
    ...over,
  };
}

type BoxPlayer = SyncBoxScoreDto["local"]["players"][number];

function boxPlayer(code: string, seconds: number, points = 10): BoxPlayer {
  return {
    player: { person: person(code) },
    stats: {
      timePlayed: seconds,
      valuation: points,
      points,
      fieldGoalsMade2: 2,
      fieldGoalsAttempted2: 4,
      fieldGoalsMade3: 1,
      fieldGoalsAttempted3: 3,
      freeThrowsMade: 3,
      freeThrowsAttempted: 4,
      totalRebounds: 5,
      offensiveRebounds: 1,
      defensiveRebounds: 4,
      assistances: 2,
      steals: 1,
      blocksFavour: 1,
      blocksAgainst: 0,
      turnovers: 2,
      foulsCommited: 3,
      foulsReceived: 4,
      plusMinus: -2,
      dorsal: 7,
      startFive: true,
    },
  };
}

const game = { gameCode: 129, homeClubCode: "PAR", awayClubCode: "BES" };

describe("parseApiDate", () => {
  it("treats a timestamp without a zone as UTC", () => {
    expect(parseApiDate("2026-09-04T13:10:29.86")?.toISOString()).toBe(
      "2026-09-04T13:10:29.860Z",
    );
  });

  it("keeps an explicit zone", () => {
    expect(parseApiDate("2026-11-20T19:45:00Z")?.toISOString()).toBe(
      "2026-11-20T19:45:00.000Z",
    );
  });

  it("returns null for missing or invalid dates", () => {
    expect(parseApiDate(null)).toBeNull();
    expect(parseApiDate(undefined)).toBeNull();
    expect(parseApiDate("not a date")).toBeNull();
  });
});

describe("rosterRows", () => {
  it("maps a roster entry to a person and a stint", () => {
    const { people, stints } = rosterRows(SEASON, [entry("011924", "PAR")]);
    expect(people).toEqual([
      expect.objectContaining({ code: "011924", birthDate: "1997-09-02", heightCm: 200 }),
    ]);
    expect(stints).toEqual([
      expect.objectContaining({
        seasonCode: SEASON,
        clubCode: "PAR",
        personCode: "011924",
        role: "J",
        active: true,
        imageUrl: "https://img/011924.png",
      }),
    ]);
  });

  it("keeps a transferred player as one person with two stints", () => {
    const { people, stints } = rosterRows(SEASON, [
      entry("004194", "PAR", { active: false, endDate: "2026-11-16T16:34:01.956" }),
      entry("004194", "ZAL", { startDate: "2026-11-20T10:00:00" }),
    ]);
    // One person row: Postgres rejects an upsert that hits the same key twice.
    expect(people).toHaveLength(1);
    expect(stints.map((s) => [s.clubCode, s.active])).toEqual([
      ["PAR", false],
      ["ZAL", true],
    ]);
  });

  it("dedupes two stints with a null start date (same key, like NULLS NOT DISTINCT)", () => {
    const { stints } = rosterRows(SEASON, [
      entry("011924", "PAR", { startDate: null, dorsal: "7" }),
      entry("011924", "PAR", { startDate: null, dorsal: "8" }),
    ]);
    expect(stints).toHaveLength(1);
    expect(stints[0]).toMatchObject({ startDate: null, dorsal: "8" });
  });

  it("keeps a player and a coach role of the same person apart", () => {
    const { stints } = rosterRows(SEASON, [
      entry("011924", "PAR"),
      entry("011924", "PAR", { type: "E" }),
    ]);
    expect(stints).toHaveLength(2);
  });
});

describe("partialsToArray", () => {
  it("puts quarters first, then overtimes in order", () => {
    expect(
      partialsToArray({
        partials1: 20,
        partials2: 21,
        partials3: 22,
        partials4: 14,
        extraPeriods: { "2": 9, "1": 14 },
      }),
    ).toEqual([20, 21, 22, 14, 14, 9]);
  });

  it("returns null when the API has no partials", () => {
    expect(partialsToArray(null)).toBeNull();
  });
});

describe("toGameRow", () => {
  it("maps a schedule game and never sets boxScoreSyncedAt", () => {
    const dto: SyncScheduleGameDto = {
      gameCode: 129,
      round: 13,
      played: true,
      utcDate: "2026-11-20T19:45:00Z",
      phaseType: { code: "RS" },
      local: { club: club("PAR"), score: 91, partials: null },
      road: { club: club("BES"), score: 87, partials: null },
      venue: { name: "Belgrade Arena" },
      audience: 7032,
    };
    const row = toGameRow(SEASON, dto);
    expect(row).toMatchObject({
      seasonCode: SEASON,
      gameCode: 129,
      phase: "RS",
      homeClubCode: "PAR",
      awayClubCode: "BES",
      homeScore: 91,
      awayScore: 87,
      venueName: "Belgrade Arena",
    });
    expect(row.utcDate?.toISOString()).toBe("2026-11-20T19:45:00.000Z");
    expect(row).not.toHaveProperty("boxScoreSyncedAt");
  });
});

describe("gamesNeedingBoxScore", () => {
  const now = new Date("2026-11-24T04:00:00Z");
  const g = (
    gameCode: number,
    played: boolean,
    utcDate: string,
    syncedAt: string | null,
  ): GameSyncState => ({
    gameCode,
    played,
    utcDate: new Date(utcDate),
    boxScoreSyncedAt: syncedAt ? new Date(syncedAt) : null,
  });

  it("never picks a game that is not played, even a recent one", () => {
    const picked = gamesNeedingBoxScore(
      [
        g(1, false, "2026-11-23T19:45:00Z", null),
        g(2, false, "2026-11-30T19:45:00Z", null),
      ],
      now,
    );
    expect(picked).toEqual([]);
  });

  it("picks played games that were never synced, however old", () => {
    const picked = gamesNeedingBoxScore([g(3, true, "2026-10-01T19:45:00Z", null)], now);
    expect(picked.map((x) => x.gameCode)).toEqual([3]);
  });

  it("re-picks synced games from the last 3 days, skips older synced ones", () => {
    const picked = gamesNeedingBoxScore(
      [
        g(4, true, "2026-11-22T19:45:00Z", "2026-11-23T04:00:00Z"),
        g(5, true, "2026-11-15T19:45:00Z", "2026-11-16T04:00:00Z"),
      ],
      now,
    );
    expect(picked.map((x) => x.gameCode)).toEqual([4]);
  });
});

describe("boxScoreRows", () => {
  const box: SyncBoxScoreDto = {
    local: { players: [boxPlayer("A", 1686, 18), boxPlayer("B", 0, 0)] },
    road: { players: [boxPlayer("C", 1200)] },
  };

  it("returns a person for every player, including ones not in any roster", () => {
    const { people } = boxScoreRows(SEASON, game, box);
    expect(people.map((p) => p.code)).toEqual(["A", "B", "C"]);
    expect(people[0]).toMatchObject({ name: "PLAYER, A", birthDate: "1997-09-02" });
  });

  it("maps every box score column and the team side", () => {
    const { stats } = boxScoreRows(SEASON, game, box);
    expect(stats).toHaveLength(3);
    expect(stats[0]).toEqual({
      seasonCode: SEASON,
      gameCode: 129,
      personCode: "A",
      clubCode: "PAR",
      isHome: true,
      started: true,
      dorsal: 7,
      seconds: 1686,
      points: 18,
      fg2Made: 2,
      fg2Att: 4,
      fg3Made: 1,
      fg3Att: 3,
      ftMade: 3,
      ftAtt: 4,
      oreb: 1,
      dreb: 4,
      reb: 5,
      ast: 2,
      stl: 1,
      tov: 2,
      blk: 1,
      blkAgainst: 0,
      foulsCommitted: 3,
      foulsDrawn: 4,
      plusMinus: -2,
      pir: 18,
    });
    expect(stats[2]).toMatchObject({ personCode: "C", clubCode: "BES", isHome: false });
  });

  it("keeps players with 0 seconds (they were in the squad)", () => {
    const { stats } = boxScoreRows(SEASON, game, box);
    expect(stats.find((s) => s.personCode === "B")?.seconds).toBe(0);
  });
});

describe("averages from stored rows (rowToBoxLine + averagesFromLines)", () => {
  /** One stored row per game for player A: DTO -> DB row, like the sync writes it. */
  function storedRow(
    gameCode: number,
    seconds: number,
    points: number,
  ): PlayerGameStatsRow {
    const box: SyncBoxScoreDto = {
      local: { players: [boxPlayer("A", seconds, points)] },
      road: { players: [] },
    };
    return boxScoreRows(SEASON, { ...game, gameCode }, box).stats[0];
  }

  it("counts only games with seconds > 0", () => {
    const rows = [storedRow(1, 0, 0), storedRow(2, 1200, 10), storedRow(3, 1800, 20)];
    const averages = averagesFromLines(rows.map(rowToBoxLine));
    expect(averages?.games).toBe(2);
    expect(averages?.points).toBe(15); // (10 + 20) / 2, not / 3
    expect(averages?.minutes).toBe(25); // (20 + 30) min / 2
  });

  it("returns null when every stored game has 0 seconds", () => {
    const rows = [storedRow(1, 0, 0), storedRow(2, 0, 0)];
    expect(averagesFromLines(rows.map(rowToBoxLine))).toBeNull();
  });
});
