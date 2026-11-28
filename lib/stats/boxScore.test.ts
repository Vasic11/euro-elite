import { describe, expect, it } from "vitest";

import type { TeamSummary } from "@/lib/euroleague/types";

import {
  type DetailedBoxLine,
  formatMinutes,
  gameLogFromGames,
  type PlayerGameLine,
  seasonRows,
  shootingPct,
  statRow,
} from "./boxScore";

function line(over: Partial<DetailedBoxLine> = {}): DetailedBoxLine {
  return {
    playerCode: "p",
    teamCode: "AAA",
    started: false,
    seconds: 600,
    points: 0,
    twoMade: 0,
    twoAttempted: 0,
    threeMade: 0,
    threeAttempted: 0,
    ftMade: 0,
    ftAttempted: 0,
    offRebounds: 0,
    defRebounds: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    turnovers: 0,
    blocks: 0,
    blocksAgainst: 0,
    foulsCommitted: 0,
    foulsDrawn: 0,
    plusMinus: 0,
    pir: 0,
    ...over,
  };
}

const team = (code: string): TeamSummary => ({
  code,
  name: code,
  shortName: code,
  crestUrl: null,
});

function game(date: string, teamCode: string, over: Partial<DetailedBoxLine> = {}) {
  return {
    gameCode: Number(date.replaceAll("-", "")),
    round: 1,
    date,
    team: team(teamCode),
    opponent: team("OPP"),
    opponentTvCode: "OPP",
    isHome: true,
    teamScore: 80,
    opponentScore: 70,
    won: true,
    line: line({ teamCode, ...over }),
  } satisfies PlayerGameLine;
}

describe("shootingPct", () => {
  it("is made / attempted in percent", () => {
    expect(shootingPct(1, 4)).toBe(25);
  });

  it("is null without attempts, so the table shows a dash and not 0%", () => {
    expect(shootingPct(0, 0)).toBeNull();
  });
});

describe("statRow", () => {
  const lines = [
    line({ seconds: 1200, started: true, points: 10, twoMade: 1, twoAttempted: 1 }),
    line({ seconds: 600, points: 4, twoMade: 0, twoAttempted: 10, plusMinus: -7 }),
    // In the squad but did not play: must not lower the averages.
    line({ seconds: 0 }),
  ];

  it("counts only games with seconds > 0", () => {
    const row = statRow(lines, "totals")!;
    expect(row.games).toBe(2);
    expect(row.starts).toBe(1);
    expect(row.values.points).toBe(14);
    expect(row.values.seconds).toBe(1800);
    expect(row.values.plusMinus).toBe(-7);
  });

  it("averages per game played", () => {
    const row = statRow(lines, "averages")!;
    expect(row.values.points).toBe(7);
    expect(row.values.seconds).toBe(900);
    expect(row.values.plusMinus).toBe(-3.5);
  });

  it("takes percentages from totals, not from an average of percentages", () => {
    // 1/1 and 0/10: average of percentages would be 50%, real is 1/11.
    const averages = statRow(lines, "averages")!;
    const totals = statRow(lines, "totals")!;
    expect(averages.twoPct).toBeCloseTo((1 / 11) * 100);
    expect(totals.twoPct).toBe(averages.twoPct);
    expect(totals.threePct).toBeNull();
  });

  it("is null when he has not played", () => {
    expect(statRow([line({ seconds: 0 })], "averages")).toBeNull();
    expect(statRow([], "totals")).toBeNull();
  });
});

describe("seasonRows", () => {
  it("is one row without a total when he played for one club", () => {
    const rows = seasonRows(
      [game("2026-10-01", "AAA"), game("2026-10-08", "AAA")],
      "totals",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].team?.code).toBe("AAA");
    expect(rows[0].row.games).toBe(2);
  });

  it("splits a transfer by club in playing order and adds a total", () => {
    const rows = seasonRows(
      [
        game("2026-12-01", "BBB", { points: 20 }),
        game("2026-10-01", "AAA", { points: 10 }),
        game("2026-10-08", "AAA", { points: 6 }),
      ],
      "averages",
    );
    expect(rows.map((r) => r.team?.code ?? "total")).toEqual(["AAA", "BBB", "total"]);
    expect(rows[0].row.values.points).toBe(8);
    expect(rows[1].row.values.points).toBe(20);
    expect(rows[2].row.values.points).toBe(12);
    expect(rows[2].row.games).toBe(3);
  });

  it("leaves out a club where he never got on the floor", () => {
    const rows = seasonRows(
      [game("2026-10-01", "AAA"), game("2026-12-01", "BBB", { seconds: 0 })],
      "totals",
    );
    expect(rows.map((r) => r.team?.code)).toEqual(["AAA"]);
  });
});

describe("formatMinutes", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatMinutes(1234)).toBe("20:34");
    expect(formatMinutes(65)).toBe("1:05");
    expect(formatMinutes(0)).toBe("0:00");
  });

  it("rounds averages to whole seconds and carries into the minute", () => {
    expect(formatMinutes(1234.4)).toBe("20:34");
    expect(formatMinutes(59.6)).toBe("1:00");
  });

  it("keeps counting minutes past an hour for season totals", () => {
    expect(formatMinutes(24725)).toBe("412:05");
  });
});

describe("gameLogFromGames", () => {
  it("skips 0-second games and sorts by round", () => {
    const later = { ...game("2026-10-20", "AAA", { pir: 9 }), round: 3 };
    const dnp = { ...game("2026-10-13", "AAA", { seconds: 0 }), round: 2 };
    const first = { ...game("2026-10-06", "AAA", { seconds: 1500, pir: 18 }), round: 1 };
    const log = gameLogFromGames([later, dnp, first]);
    expect(log.map((e) => e.round)).toEqual([1, 3]);
    expect(log[0]).toMatchObject({ minutes: 25, pir: 18, opponent: team("OPP") });
  });
});
